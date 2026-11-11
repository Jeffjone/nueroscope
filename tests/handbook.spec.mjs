import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const pages = [
  "index",
  "top5",
  "terminology",
  "conditions",
  "school",
  "hndp",
  "factmyth",
  "learnmore",
  "sources",
  "about",
];
for (const name of pages) {
  test(`${name}: readable page, no runtime errors, accessible structure`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/${name}.html`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
}
test("responsive pages keep content within the viewport, including large text", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of pages) {
      await page.goto(`/${name}.html`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${name} overflows at ${width}`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of pages) {
    await page.goto(`/${name}.html`);
    await page.evaluate(() =>
      document.documentElement.classList.add("large-text"),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `${name} large text overflows`,
    ).toBe(true);
  }
});
test("global search supports terms, typos, keyboard navigation, and safe input", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search the handbook" }).click();
  await page
    .getByRole("searchbox", { name: "Search all handbook content" })
    .fill("masking");
  await expect(page.locator(".search-result").first()).toContainText("Masking");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/terminology.html#masking-camouflaging/);
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+k" : "Control+k",
  );
  await page
    .getByRole("searchbox", { name: "Search all handbook content" })
    .fill("dysleia");
  await expect(page.locator(".search-result").first()).toContainText(
    "Dyslexia",
  );
  await page
    .getByRole("searchbox", { name: "Search all handbook content" })
    .fill("<img src=x onerror=alert(1)>");
  await expect(page.locator(".search-empty")).toContainText("No matches");
  await page.keyboard.press("Escape");
  await expect(page.locator("#search-dialog")).not.toBeVisible();
});
test("glossary and condition filters reset and deep links reveal hidden entries", async ({
  page,
}) => {
  await page.goto("/terminology.html");
  await page
    .getByRole("searchbox", { name: "Search terminology" })
    .fill("masking");
  await expect(page.locator(".term:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await expect(page.locator("#term-empty")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".term:visible")).toHaveCount(18);
  await page.goto("/conditions.html");
  await page
    .getByRole("button", { name: "Learning & movement", exact: true })
    .click();
  await expect(page.locator(".condition:visible")).toHaveCount(3);
  await page.evaluate(() => (location.hash = "autism"));
  await expect(page.locator("#autism")).toBeVisible();
  await page.locator("#autism summary").click();
  await expect(page.locator("#autism details")).toHaveAttribute("open", "");
});
test("reader preferences and chapter progress persist and can be reset", async ({
  page,
}) => {
  await page.goto("/top5.html");
  await page.getByRole("button", { name: "Mark as read", exact: true }).click();
  await expect(page.locator("#reading-count")).toHaveText("1 / 8");
  await page.getByRole("button", { name: "Reading preferences" }).click();
  await page.getByRole("switch", { name: /Larger text/ }).check();
  await page.getByRole("switch", { name: /Calm mode/ }).check();
  await page.keyboard.press("Escape");
  await page.goto("/about.html");
  await expect(page.locator("html")).toHaveClass(/large-text/);
  await expect(page.locator("html")).toHaveClass(/calm-mode/);
  await expect(page.locator("#reading-count")).toHaveText("1 / 8");
  await page
    .getByRole("button", { name: "Reset reading progress & preferences" })
    .click();
  await expect(page.locator("#reading-count")).toHaveText("0 / 8");
  await expect(page.locator("html")).not.toHaveClass(/large-text/);
});
test("six-question quiz explains answers, scores once, and restarts", async ({
  page,
}) => {
  await page.goto("/factmyth.html");
  for (const choice of ["Myth", "Myth", "Fact", "Myth", "More to it", "Myth"]) {
    await page.getByRole("button", { name: choice, exact: true }).click();
    await expect(page.locator("#quiz-feedback")).toContainText("That’s right");
    await expect(page.locator("[data-answer]").first()).toBeDisabled();
    await page.locator("#quiz-next").click();
  }
  await expect(page.locator(".result-score")).toHaveText("6 / 6");
  await expect(page.locator(".quiz-review li")).toHaveCount(6);
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("#quiz-position")).toHaveText("QUESTION 01 OF 06");
  await expect(page.locator("#quiz-score")).toHaveText("0 correct so far");
});
test("school planner builds a printable checklist and clears selections", async ({
  page,
}) => {
  await page.goto("/school.html");
  await expect(
    page.getByRole("button", { name: "Print my checklist" }),
  ).toBeDisabled();
  await page.locator('input[name="support"]').nth(0).check();
  await page.locator('input[name="support"]').nth(5).check();
  await expect(page.locator("#support-selection li")).toHaveCount(2);
  await expect(page.locator("#support-count")).toContainText("2 ideas");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".selected-support")).toBeVisible();
  await expect(page.locator(".support-options")).not.toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(page.locator("#support-selection li")).toHaveCount(0);
});
test("mobile navigation traps focus, closes with Escape, and links work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator(".sidebar-bottom>a")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page
    .getByRole("link", { name: "A more inclusive school", exact: true })
    .click();
  await expect(page).toHaveURL(/school.html/);
});
test("video embeds load only after an explicit click", async ({ page }) => {
  await page.goto("/hndp.html");
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      body: "<html><title>Video placeholder</title></html>",
      contentType: "text/html",
    }),
  );
  await page
    .getByRole("button", {
      name: "Play video: Understanding life after a late diagnosis",
    })
    .click();
  await expect(page.locator("iframe")).toHaveCount(1);
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "Understanding life after a late diagnosis",
  );
});
test("core content stays readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const name of ["index", "terminology", "conditions", "factmyth"]) {
    await page.goto(`http://127.0.0.1:4173/${name}.html`);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.locator(".answer-guide summary").click();
  await expect(page.locator(".answer-guide article")).toHaveCount(6);
  await context.close();
});
test("search, reader preferences, mobile navigation, and quiz feedback remain accessible", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search the handbook" }).click();
  await expect(page.locator(".search-result").first()).toBeVisible();
  let scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reading preferences" }).click();
  scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.getByRole("button", { name: "Close navigation" }).click();
  await page.goto("/factmyth.html");
  await page.getByRole("button", { name: "Myth", exact: true }).click();
  scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
});
test("blocked storage and failed optional requests leave usable fallback content", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/top5.html");
  await page.getByRole("button", { name: "Mark as read", exact: true }).click();
  await expect(page.locator("#reading-count")).toHaveText("1 / 8");
  await page.route("**/search-index.json", (route) => route.abort());
  await page.getByRole("button", { name: "Search the handbook" }).click();
  await expect(page.locator(".search-empty")).toContainText(
    "Search could not load",
  );
  await page.keyboard.press("Escape");
  await page.route("**/quiz.json", (route) => route.abort());
  await page.goto("/factmyth.html");
  await expect(page.locator("#quiz-feedback")).toContainText("could not load");
  await page.locator(".answer-guide summary").click();
  await expect(page.locator(".answer-guide article")).toHaveCount(6);
  expect(errors).toEqual([]);
});
test("perspective explorer changes the lesson and destination with keyboard controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".neural-experience")).toHaveClass(/canvas-ready/);
  const senses = page.getByRole("button", { name: "02 Senses", exact: true });
  await senses.focus();
  await page.keyboard.press("Enter");
  await expect(senses).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#perspective-title")).toHaveText(
    "The same room can feel very different.",
  );
  await expect(page.locator("#perspective-link")).toHaveAttribute(
    "href",
    "terminology.html#sensory-sensitivity",
  );
  await page
    .getByRole("button", { name: "03 Connection", exact: true })
    .click();
  await expect(page.locator("#perspective-description")).toContainText(
    "communication preferences",
  );
  await expect(page.locator("#perspective-link")).toHaveAttribute(
    "href",
    "school.html",
  );
});
test("inclusion explorer changes context and explains the selected access options", async ({
  page,
}) => {
  await page.goto("/");
  const access = page.getByRole("button", {
    name: "Show access options",
    exact: true,
  });
  await access.click();
  await expect(access).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#factor-two")).toHaveText(
    "Written + spoken steps",
  );
  await page
    .getByRole("button", { name: "A group project 02", exact: true })
    .click();
  await expect(page.locator("#factor-two")).toHaveText(
    "Time to respond in writing",
  );
  await expect(page.locator("#environment-takeaway")).toContainText("writing");
  await access.click();
  await expect(page.locator("#factor-two")).toHaveText(
    "Fast, overlapping discussion",
  );
  await page
    .getByRole("button", { name: "A new routine 03", exact: true })
    .click();
  await expect(page.locator("#factor-one")).toHaveText("Last-minute changes");
  await access.click();
  await expect(page.locator("#factor-one")).toHaveText(
    "Advance notice where possible",
  );
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
});
test("homepage knowledge check explains both choices and links to the full quiz", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "It’s a fact", exact: false }).click();
  await expect(page.locator("#quick-feedback")).toContainText(
    "A chance to rethink",
  );
  await page.getByRole("button", { name: "It’s a myth", exact: false }).click();
  await expect(page.locator("#quick-feedback")).toContainText("Exactly.");
  await page
    .getByRole("link", { name: "Take the full knowledge check" })
    .click();
  await expect(page).toHaveURL(/factmyth.html/);
});
test("ambient canvas motion can be paused and resumed, and honors reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".neural-experience")).toHaveClass(/canvas-ready/);
  const canvas = page.locator("#neural-canvas");
  const first = await canvas.evaluate((c) => c.toDataURL());
  await expect
    .poll(async () => (await canvas.evaluate((c) => c.toDataURL())) !== first)
    .toBe(true);
  await page
    .getByRole("button", { name: "Pause motion", exact: false })
    .click();
  await expect(page.locator("html")).toHaveClass(/calm-mode/);
  await page.waitForTimeout(100);
  const paused = await canvas.evaluate((c) => c.toDataURL());
  await page.waitForTimeout(180);
  expect((await canvas.evaluate((c) => c.toDataURL())) === paused).toBe(true);
  await page
    .getByRole("button", { name: "Resume motion", exact: false })
    .click();
  await expect(page.locator("html")).not.toHaveClass(/calm-mode/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Reduced motion", exact: false }),
  ).toBeDisabled();
});
test("static artwork and navigation remain available with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.locator(".neural-fallback")).toBeVisible();
  await expect(page.locator(".sidebar")).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("link", { name: "Five things to know", exact: true })
    .click();
  await expect(page).toHaveURL(/top5.html/);
  await context.close();
});
