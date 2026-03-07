import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixBrokenRegex(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      fixBrokenRegex(fullPath);
    } else if (item.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // The broken code looks like:
      // export async function POST(req: NextRequest) {
      //   let body: any = {};
      //   try {
      //     body = await req.json();
      //   } catch(e) {} // ignore json parse errors for webhooks etc
      //   , { status: X });
      //   }
      
      // Let's replace the broken block with a clean one
      content = content.replace(
        /export async function POST\(req: NextRequest\) \{\n\s*let body: any = \{\};\n\s*try \{\n\s*body = await req\.json\(\);\n\s*\} catch\(e\) \{\} \/\/ ignore json parse errors for webhooks etc[\s\S]*?(?=\n\s*try \{)/g,
        'export async function POST(req: NextRequest) {\n  let body: any = {};\n  try {\n    body = await req.json();\n  } catch(e) {} // ignore parse errors\n'
      );

      // Also fix any remaining res.status() calls that weren't caught
      content = content.replace(/return res\.status\((\d+)\)\.json\((.*?)\);/g, 'return NextResponse.json($2, { status: $1 });');
      content = content.replace(/return res\.status\((\d+)\)\.send\((.*?)\);/g, 'return new NextResponse($2, { status: $1 });');
      content = content.replace(/res\.status\((\d+)\)\.json\((.*?)\)/g, 'NextResponse.json($2, { status: $1 })');
      content = content.replace(/return res\./g, 'return '); // fix 'return res.NextResponse'

      fs.writeFileSync(fullPath, content);
    }
  }
}

fixBrokenRegex(path.join(__dirname, 'src', 'app', 'api'));
