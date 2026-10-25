const port = process.env.PORT || 3001;
try {
  const response = await fetch('http://127.0.0.1:' + port + '/health', { signal: AbortSignal.timeout(4000) });
  const data = await response.json();
  process.exit(response.status === 200 && data.database === 'connected' ? 0 : 1);
} catch { process.exit(1); }

