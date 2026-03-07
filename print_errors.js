import fs from 'fs';

const content = fs.readFileSync('ts_errors.txt', 'utf8');
const lines = content.split('\n');

console.log('--- API Errors ---');
let currentFile = '';
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.includes('src/app/api/')) {
    const fileMatch = line.match(/^([^(]+)/);
    if (fileMatch) {
      const fileName = fileMatch[1];
      if (fileName !== currentFile) {
        console.log(`\nFile: ${fileName}`);
        currentFile = fileName;
      }
      console.log(`  ${line}`);
      // Look ahead for the error message
      if (i + 1 < lines.length && lines[i+1].includes('error TS')) {
        console.log(`    ${lines[i+1].trim()}`);
      }
    }
  }
}
