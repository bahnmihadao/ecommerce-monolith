const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.join(__dirname, 'docs', 'HUONG_DAN_DEMO_TH2.html');
const pdfPath = path.join(__dirname, 'docs', 'HUONG_DAN_DEMO_TH2.pdf');

if (!fs.existsSync(htmlPath)) {
  console.error('HTML template not found at:', htmlPath);
  process.exit(1);
}

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const command = `"${edgePath}" --headless=old --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;

console.log('Generating PDF from HTML template for TH2...');
execSync(command);

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log(`PDF generated successfully! Size: ${stats.size} bytes at ${pdfPath}`);
} else {
  console.error('PDF file was not found!');
  process.exit(1);
}
