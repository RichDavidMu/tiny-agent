/**
 * 构建脚本 - 使用 esbuild 打包扩展
 */

import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, context } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const srcDir = join(rootDir, 'src');

const isWatch = process.argv.includes('--watch');

// 确保 dist 目录存在
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// esbuild 基础配置
const buildOptions = {
  bundle: true,
  format: 'iife', // 立即执行函数，不需要模块系统
  target: 'chrome100',
  sourcemap: false,
  minify: !isWatch,
};

// 构建 background script
const backgroundOptions = {
  ...buildOptions,
  entryPoints: [join(srcDir, 'background.ts')],
  outfile: join(distDir, 'background.js'),
};

// 构建 content script
const contentOptions = {
  ...buildOptions,
  entryPoints: [join(srcDir, 'content.ts')],
  outfile: join(distDir, 'content.js'),
};

// 构建 content script
const pageBridgeOptions = {
  ...buildOptions,
  entryPoints: [join(srcDir, 'page-bridge.ts')],
  outfile: join(distDir, 'page-bridge.js'),
};

// 复制资源文件
function copyAssets() {
  // 复制 manifest.json
  const manifestSrc = join(rootDir, 'manifest.json');
  if (existsSync(manifestSrc)) {
    cpSync(manifestSrc, join(distDir, 'manifest.json'));
    console.log('  ✓ manifest.json');
  }

  // 复制 icons 目录
  const iconsSrc = join(rootDir, 'icons');
  if (existsSync(iconsSrc)) {
    cpSync(iconsSrc, join(distDir, 'icons'), { recursive: true });
    console.log('  ✓ icons/');
  }
}

async function buildExtension() {
  console.log('🔨 Building MCP Bridge Extension...\n');

  try {
    // 构建脚本
    console.log('📦 Bundling scripts...');
    await build(backgroundOptions);
    console.log('  ✓ background.js');
    await build(contentOptions);
    console.log('  ✓ content.js');
    await build(pageBridgeOptions);
    console.log('  ✓ page-bridge.js');

    // 复制资源
    console.log('\n📋 Copying assets...');
    copyAssets();

    console.log('\n✅ Build completed successfully!');
    console.log('   Output: dist/');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

async function watchExtension() {
  console.log('👀 Watching for changes...\n');

  try {
    // 创建 watch context
    const bgCtx = await context(backgroundOptions);
    const contentCtx = await context(contentOptions);

    // 初始构建
    await bgCtx.rebuild();
    console.log('  ✓ background.js');
    await contentCtx.rebuild();
    console.log('  ✓ content.js');
    copyAssets();

    // 开始监听
    await bgCtx.watch();
    await contentCtx.watch();

    console.log('\n✅ Watching for changes... (Ctrl+C to stop)');
  } catch (error) {
    console.error('❌ Watch failed:', error);
    process.exit(1);
  }
}

if (isWatch) {
  watchExtension();
} else {
  buildExtension();
}
