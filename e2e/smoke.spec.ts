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
