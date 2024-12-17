// 这个文件会帮我们打包 package 下的模块，最终打包出jsw文件

// node scripts/dev.js （要打包的名字 -f 打包的格式） === argv

import minimist from 'minimist';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module'; //y用于创建特定目录下的 require 函数
import esbuild from 'esbuild';

// nodex 中的命令行参数通过process来获取   process.argv
const args = minimist(process.argv.slice(2));
const __filename = fileURLToPath(import.meta.url); // 获取当前文件的绝对路径 file: -> /usr
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url); // 用于创建特定目录下的 require 函数
const target = args._[0] || 'reactivity'; //打包哪个项目
const format = args.f || 'iife'; //打包h后的模块化规范


// node 中esm模块没有 __dirname
// 根据命令行提供的路径进行解析  入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`);

esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 出口文件
    bundle: true, // reactivity -> shared
    platform: 'browser', //打包后给浏览器使用
    sourcemap: true, // 可以调试源码
    format: format, // 三种 cjs esm iife
    globalName: pkg.buildOptions?.name // 给 iife 立即执行函数 提供
  })
  .then((ctx) => {
    console.log('start dev');

    return ctx.watch(); // 监控入口文件 持续打包处理
  });
