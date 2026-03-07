import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function migrateDirectory(sourceDir, relativePath = '') {
  const items = fs.readdirSync(sourceDir);

  for (const item of items) {
    if (item === 'tsconfig.json') continue;

    const sourcePath = path.join(sourceDir, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      migrateDirectory(sourcePath, path.join(relativePath, item));
    } else if (item.endsWith('.ts')) {
      const endpointName = item.replace('.ts', '');
      const targetDir = path.join(__dirname, 'src', 'app', 'api', relativePath, endpointName);
      const targetPath = path.join(targetDir, 'route.ts');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      let content = fs.readFileSync(sourcePath, 'utf8');

      content = content.replace(/import { VercelRequest, VercelResponse } from "@vercel\/node";\n?/g, 'import { NextResponse, NextRequest } from "next/server";\n\n');
      
      content = content.replace(/export default async function handler\(req: VercelRequest, res: VercelResponse\) {/g, 'export async function POST(req: NextRequest) {\n  let body: any = {};\n  try {\n    body = await req.json();\n  } catch(e) {} // ignore json parse errors for webhooks etc');
      
      content = content.replace(/\.\.\/src\/lib\/firebaseAdmin/g, '@/lib/firebaseAdmin');
      content = content.replace(/\.\.\/lib\/firebaseAdmin/g, '@/lib/firebaseAdmin');
      content = content.replace(/\.\.\/\.\.\/src\/lib\/firebaseAdmin/g, '@/lib/firebaseAdmin');
      content = content.replace(/\.\.\/\.\.\/lib\/firebaseAdmin/g, '@/lib/firebaseAdmin');

      content = content.replace(/req\.body/g, 'body');
      content = content.replace(/req\.headers\['(.*?)'\]/g, 'req.headers.get("$1")');
      
      content = content.replace(/return res\.status\((\d+)\)\.json\((.*?)\);?/g, 'return NextResponse.json($2, { status: $1 });');
      
      content = content.replace(/if \(req\.method !== "POST"\) {[\s\S]*?}/g, '');
      content = content.replace(/if \(req\.method === "GET"\) {[\s\S]*?}/g, '');

      fs.writeFileSync(targetPath, content);
      console.log(`Migrated ${item} to ${targetPath}`);
    }
  }
}

migrateDirectory(path.join(__dirname, 'api'));
