import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: process.platform === "darwin" ? "chrome" : undefined,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const svg = (await readFile("assets/neural-poster.svg")).toString("base64");
  const font = (await readFile("assets/manrope-variable.ttf")).toString(
    "base64",
  );
  await page.setContent(
    `<style>@font-face{font-family:Manrope;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#08090d;color:#f0eef5;width:1200px;height:630px;display:flex;align-items:center;padding:60px;font-family:Manrope,sans-serif;position:relative;overflow:hidden}.copy{position:relative;z-index:1;width:750px}strong{font-size:25px;letter-spacing:-1.5px}small{display:block;font:9px monospace;letter-spacing:2px;margin-top:45px;color:#aaa9b7}h1{font:700 107px/.9 Manrope,sans-serif;letter-spacing:-8px;margin:30px 0}em{color:#baa3f7;font-style:normal}p{font-size:16px;color:#aaa9b7;max-width:450px;line-height:1.8}img{position:absolute;width:600px;right:-30px;top:15px}footer{font:10px monospace;letter-spacing:2px;color:#aaa9b7;margin-top:35px}</style><div class="copy"><strong>NeuroScope↗</strong><small>THE NEURODIVERSITY HANDBOOK</small><h1>WIRED<br><em>DIFFERENT.</em></h1><p>Not every mind takes the same path.<br>That’s where the possibility begins.</p><footer>NEUROSCOPE.US</footer></div><img src="data:image/svg+xml;base64,${svg}">`,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "assets/social.png" });
} finally {
  await browser.close();
}
