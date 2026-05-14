import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

// オレンジ背景に白い肉球のSVGアイコン
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- 背景（角丸正方形） -->
  <rect width="512" height="512" rx="110" fill="#f97316"/>

  <!-- 肉球：メインパッド -->
  <ellipse cx="256" cy="330" rx="95" ry="82" fill="white"/>

  <!-- 肉球：指パッド4つ -->
  <ellipse cx="148" cy="224" rx="48" ry="42" fill="white"/>
  <ellipse cx="216" cy="178" rx="48" ry="42" fill="white"/>
  <ellipse cx="296" cy="178" rx="48" ry="42" fill="white"/>
  <ellipse cx="364" cy="224" rx="48" ry="42" fill="white"/>
</svg>`;

const buf = Buffer.from(svg);

await sharp(buf).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(buf).resize(512, 512).png().toFile("public/icons/icon-512.png");

console.log("✓ icon-192.png, icon-512.png を生成しました");
