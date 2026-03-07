const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const apiDir = path.join(process.cwd(), 'src/app/api');
const files = getFiles(apiDir);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8').trim();
  if (!content.endsWith('}')) {
    console.log(`MISSING BRACE: ${file}`);
  } else {
    // Basic check for function closure
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        console.log(`BRACE MISMATCH (${openBraces} vs ${closeBraces}): ${file}`);
    }
  }
});
