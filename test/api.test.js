import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const schema = 'test_' + randomUUID().replaceAll('-', '');
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('schema', schema);
process.env.DATABASE_URL = url.toString();
process.env.ADMIN_USERNAME = 'test_admin';
process.env.ADMIN_PASSWORD = randomUUID();
const customerPassword = 'CustomerPassword123!';
let prisma, server, base, adminToken, customerToken, otherToken, uid;
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
async function call(path, method = 'GET', body, token) {
  const response = await fetch(base + path, {
    method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}
before(async () => {
  await db.connect();
  await db.query('CREATE SCHEMA "' + schema + '"');
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });
  execFileSync(process.execPath, ['prisma/seed.js'], { env: process.env, stdio: 'pipe' });
  ({ prisma } = await import('../src/db.js'));
  const { app } = await import('../src/app.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  adminToken = (await call('/api/auth/login', 'POST', { username: 'test_admin', password: process.env.ADMIN_PASSWORD })).body.accessToken;
  assert.ok(adminToken);
  for (const username of ['customer1', 'customer2']) {
    const result = await call('/api/auth/register', 'POST', { username, fullname: username, password: customerPassword });
    assert.equal(result.status, 201);
    const token = (await call('/api/auth/login', 'POST', { username, password: customerPassword })).body.accessToken;
    if (username === 'customer1') { customerToken = token; uid = result.body.uid; } else otherToken = token;
  }
});
after(async () => {
  if (server) await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); });
  if (prisma) await prisma.$disconnect();
  if (/^test_[a-f0-9]{32}$/.test(schema)) await db.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
  await db.end();
});
test('Health uses a real database query', async () => {
  const result = await call('/health');
  assert.equal(result.status, 200);
  assert.equal(result.body.database, 'connected');
});
test('Registration stores password hash, rejects duplicate and role injection', async () => {
  const record = await prisma.user.findUnique({ where: { uid } });
  assert.notEqual(record.password, customerPassword);
  assert.match(record.password, /^\$2/);
  assert.equal((await call('/api/auth/register', 'POST', { username: 'customer1', fullname: 'A', password: customerPassword })).status, 409);
  assert.equal((await call('/api/auth/register', 'POST', { username: 'intruder', fullname: 'A', password: customerPassword, roleid: 1 })).status, 400);
  const me = await call('/api/users/me', 'GET', undefined, customerToken);
  assert.equal(me.body.role.rolename, 'normal');
  assert.equal(me.body.membership.score, 10);
  assert.equal(me.body.password, undefined);
});
test('JWT missing, forged, expired and bad password return 401', async () => {
  assert.equal((await call('/api/users/me')).status, 401);
  assert.equal((await call('/api/users/me', 'GET', undefined, 'bad.token')).status, 401);
  const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: String(uid), expiresIn: -1, issuer: 'ecommerce-monolith', audience: 'ecommerce-api' });
  assert.equal((await call('/api/users/me', 'GET', undefined, expired)).status, 401);
  assert.equal((await call('/api/auth/login', 'POST', { username: 'customer1', password: 'wrong' })).status, 401);
});
test('Customer cannot mutate products or read admin users', async () => {
  assert.equal((await call('/api/products', 'POST', { pname: 'A', price: '1.00', quantity: 1 }, customerToken)).status, 403);
  assert.equal((await call('/api/users', 'GET', undefined, customerToken)).status, 403);
});
test('Product CRUD, decimal precision and unknown ids', async () => {
  const created = await call('/api/products', 'POST', { pname: 'CRUD', price: '19.99', quantity: 10 }, adminToken);
  assert.equal(created.status, 201);
  const path = '/api/products/' + created.body.pid;
  assert.equal((await call(path)).body.price, '19.99');
  assert.equal((await call(path, 'PUT', { pname: 'Updated', price: '20.01', quantity: 5 }, adminToken)).status, 200);
  assert.equal((await call(path)).body.quantity, 5);
  assert.equal((await call(path, 'DELETE', undefined, adminToken)).status, 204);
  assert.equal((await call(path)).status, 404);
});
test('Reject negative stock, fractional stock, invalid price precision and unexpected fields', async () => {
  for (const bad of [{ quantity: -1 }, { quantity: 1.2 }, { price: '0.001' }, { price: 12.5 }, { price: '100000000.00' }, { pid: 9 }]) {
    assert.equal((await call('/api/products', 'POST', { pname: 'Invalid', price: '1.00', quantity: 1, ...bad }, adminToken)).status, 400);
  }
});
test('Order gets uid and price from server, freezes price and restricts ownership', async () => {
  const p = (await call('/api/products', 'POST', { pname: 'Order product', price: '19.99', quantity: 10 }, adminToken)).body;
  const order = await call('/api/orders', 'POST', { items: [{ pid: p.pid, qty: 2 }] }, customerToken);
  assert.equal(order.status, 201);
  assert.equal(order.body.uid, uid);
  assert.equal(order.body.total, '39.98');
  assert.equal((await call('/api/products/' + p.pid)).body.quantity, 8);
  await call('/api/products/' + p.pid, 'PUT', { pname: p.pname, price: '30.00', quantity: 8 }, adminToken);
  const path = '/api/orders/' + order.body.oid;
  assert.equal((await call(path, 'GET', undefined, customerToken)).body.total, '39.98');
  assert.equal((await call(path, 'GET', undefined, otherToken)).status, 404);
  assert.equal((await call(path, 'GET', undefined, adminToken)).status, 200);
  assert.equal((await call('/api/products/' + p.pid, 'DELETE', undefined, adminToken)).status, 409);
  assert.equal((await call('/api/orders', 'GET', undefined, otherToken)).body.some(o => o.oid === order.body.oid), false);
});
test('Failed order rolls back all stock deductions', async () => {
  const a = await prisma.product.create({ data: { pname: 'A', price: '5.00', quantity: 5 } });
  const b = await prisma.product.create({ data: { pname: 'B', price: '5.00', quantity: 0 } });
  const before = await prisma.order.count();
  assert.equal((await call('/api/orders', 'POST', { items: [{ pid: a.pid, qty: 2 }, { pid: b.pid, qty: 1 }] }, customerToken)).status, 409);
  assert.equal((await prisma.product.findUnique({ where: { pid: a.pid } })).quantity, 5);
  assert.equal(await prisma.order.count(), before);
});
test('Concurrent orders cannot oversell the last item', async () => {
  const p = await prisma.product.create({ data: { pname: 'Last item', price: '1.00', quantity: 1 } });
  const results = await Promise.all([customerToken, otherToken].map(token => call('/api/orders', 'POST', { items: [{ pid: p.pid, qty: 1 }] }, token)));
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal((await prisma.product.findUnique({ where: { pid: p.pid } })).quantity, 0);
  assert.equal(await prisma.orderDetail.count({ where: { pid: p.pid } }), 1);
});
test('Orders reject empty items, duplicates, client uid or price', async () => {
  for (const body of [{ items: [] }, { items: [{ pid: 1, qty: 1 }, { pid: 1, qty: 1 }] }, { uid, items: [{ pid: 1, qty: 1 }] }, { items: [{ pid: 1, qty: 1, unit_price: '0' }] }]) {
    assert.equal((await call('/api/orders', 'POST', body, customerToken)).status, 400);
  }
});
test('Shipment state transitions and ownership', async () => {
  const order = (await prisma.order.findFirst({ where: { uid }, orderBy: { oid: 'asc' } }));
  const customerShipment = await call('/api/orders/' + order.oid + '/shipments', 'POST', {}, customerToken);
  assert.equal(customerShipment.status, 201);
  const shipment = await call('/api/orders/' + order.oid + '/shipments', 'POST', {}, adminToken);
  assert.equal(shipment.status, 201);
  const path = '/api/shipments/' + shipment.body.shipid;
  assert.equal((await call(path, 'PATCH', { status: 'DELIVERED' }, adminToken)).status, 409);
  assert.equal((await call(path, 'PATCH', { status: 'SHIPPED' }, adminToken)).status, 200);
  assert.equal((await call(path, 'PATCH', { status: 'DELIVERED' }, adminToken)).status, 200);
  assert.equal((await call(path, 'PATCH', { status: 'CANCELLED' }, adminToken)).status, 409);
  assert.equal((await call('/api/orders/' + order.oid + '/shipments', 'GET', undefined, otherToken)).status, 404);
});
test('Membership CRUD, role list and immediate role revocation', async () => {
  const roles = (await call('/api/roles', 'GET', undefined, adminToken)).body;
  const normalRole = roles.find(r => r.rolename === 'normal' || r.rolename === 'CUSTOMER');
  const adminRole = roles.find(r => r.rolename === 'ADMIN');
  const membership = await call('/api/memberships', 'POST', { mname: 'GOLD', score: 100 }, adminToken);
  assert.equal(membership.status, 201);
  const path = '/api/memberships/' + membership.body.mid;
  assert.equal((await call(path, 'PUT', { mname: 'GOLD', score: 200 }, adminToken)).status, 200);
  assert.equal((await call('/api/users/' + uid, 'PATCH', { mid: membership.body.mid, roleid: adminRole.roleid }, adminToken)).status, 200);
  assert.equal((await call('/api/users', 'GET', undefined, customerToken)).status, 200);
  assert.equal((await call(path, 'DELETE', undefined, adminToken)).status, 409);
  await call('/api/users/' + uid, 'PATCH', { roleid: normalRole.roleid }, adminToken);
  assert.equal((await call('/api/users', 'GET', undefined, customerToken)).status, 403);
  const unused = await call('/api/memberships', 'POST', { mname: 'UNUSED', score: 300 }, adminToken);
  assert.equal((await call('/api/memberships/' + unused.body.mid, 'DELETE', undefined, adminToken)).status, 204);
});
test('Malformed JSON returns 400 and unknown endpoint returns 404', async () => {
  const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  assert.equal((await call('/missing')).status, 404);
});
test('Readiness returns 503 on a simulated database query failure', async () => {
  // Direct disconnect would reconnect; inject a query failure only for this boundary check.
  const original = prisma.$queryRaw;
  prisma.$queryRaw = async () => { throw new Error('Database unavailable'); };
  try { assert.equal((await call('/health')).status, 503); }
  finally { prisma.$queryRaw = original; }
});
