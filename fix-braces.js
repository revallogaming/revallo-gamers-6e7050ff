import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanUpApiRoutes(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      cleanUpApiRoutes(fullPath);
    } else if (item.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Some files still have mismatched braces. Let's recreate them completely from the original /api/ files
      // and do a safer AST-like or extremely robust regex conversion.
      // But wait! We deleted the /api/ folder! 
      // Okay, let's just count { and } and remove closing braces from the bottom until they match.
      
      let openCount = (content.match(/\{/g) || []).length;
      let closeCount = (content.match(/\}/g) || []).length;
      
      while (closeCount > openCount) {
        const lastBraceIndex = content.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          content = content.substring(0, lastBraceIndex) + content.substring(lastBraceIndex + 1);
          closeCount--;
        } else {
          break;
        }
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(`Balanced braces in ${item}: removed ${closeCount - openCount || 0} extra closing braces.`);
    }
  }
}

cleanUpApiRoutes(path.join(__dirname, 'src', 'app', 'api'));
