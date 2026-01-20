/**
 * 打包脚本 - 创建扩展 zip 文件
 */

import { createWriteStream, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// 读取版本号
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version;

async function pack() {
  if (!existsSync(distDir)) {
    console.error('❌ dist/ directory not found. Run "pnpm build" first.');
    process.exit(1);
  }

  const zipName = `mcp-bridge-extension-v${version}.zip`;
  const zipPath = join(rootDir, zipName);

  console.log(`📦 Packing extension to ${zipName}...\n`);

  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    const size = (archive.pointer() / 1024).toFixed(2);
    console.log(`\n✅ Extension packed successfully!`);
    console.log(`   File: ${zipName}`);
    console.log(`   Size: ${size} KB`);
    console.log('\n📝 To install in Chrome:');
    console.log('   1. Go to chrome://extensions/');
    console.log('   2. Enable "Developer mode"');
    console.log('   3. Drag and drop the zip file, or');
    console.log('   4. Click "Load unpacked" and select the dist/ folder');
  });

  archive.on('error', (err) => {
    console.error('❌ Pack failed:', err);
    process.exit(1);
  });

  archive.pipe(output);

  // 添加 dist 目录内容
  archive.directory(distDir, false);

  await archive.finalize();
}

pack();
