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
  const svg = (await readFile("assets/mind-map.svg")).toString("base64");
  const font = (await readFile("assets/manrope-variable.ttf")).toString(
    "base64",
  );
  await page.setContent(
    `<style>@font-face{font-family:Manrope;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#fbfaf6;color:#253d33;width:1200px;height:630px;display:flex;align-items:center;padding:65px;font-family:Manrope,sans-serif;position:relative;border:20px solid #eef0e7}.copy{position:relative;z-index:1;width:650px}strong{font-size:25px;letter-spacing:-1.5px}small{display:block;font-size:10px;letter-spacing:3px;margin-top:40px;color:#566157}h1{font:72px/1.08 Georgia,serif;letter-spacing:-3px;margin:20px 0 25px;white-space:nowrap}em{color:#788b68}p{font-size:17px;color:#566157;max-width:490px;line-height:1.8}img{position:absolute;width:520px;right:0;top:95px}footer{font-size:11px;letter-spacing:2px;color:#566157;margin-top:35px}</style><div class="copy"><strong>NeuroScope.</strong><small>THE NEURODIVERSITY HANDBOOK</small><h1>Different minds.<br><em>A wider world.</em></h1><p>Understand different minds. Challenge assumptions.<br>Make room for every kind of mind.</p><footer>NEUROSCOPE.US</footer></div><img src="data:image/svg+xml;base64,${svg}">`,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "assets/social.png" });
} finally {
  await browser.close();
}
