import { expect, test } from "@playwright/test";

test("loads a canvas without page errors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page.locator("canvas")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("starts Find Zaga without page errors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(1000);
  // A corner click focuses the canvas without hitting a mode button.
  await canvas.click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  // Through the intro, then walk a moment.
  await page.keyboard.press("Space");
  await page.keyboard.press("Space");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowRight");
  expect(pageErrors).toEqual([]);
});
