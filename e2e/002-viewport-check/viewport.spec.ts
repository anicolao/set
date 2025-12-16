import { test, expect, Page } from '@playwright/test';
import { createScreenshotHelper } from '../helpers/screenshot-helper';

async function verifyCardsWithinBounds(page: Page) {
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("Viewport not set");

    const width = viewport.width;
    const height = viewport.height;
    const marginX = width * 0.1;
    const marginY = height * 0.1;

    // Wait for board to stabilize
    await expect(page.locator('.board')).toBeVisible();

    const cards = await page.locator('.card').all();
    expect(cards.length).toBe(12);

    for (const [i, card] of cards.entries()) {
        const box = await card.boundingBox();
        if (!box) throw new Error(`Card ${i} has no bounding box`);

        // Check all corners
        // Top-Left
        expect(box.x, `Card ${i} X < 10%`).toBeGreaterThanOrEqual(marginX);
        expect(box.y, `Card ${i} Y < 10%`).toBeGreaterThanOrEqual(marginY);

        // Bottom-Right
        expect(box.x + box.width, `Card ${i} Right > 90%`).toBeLessThanOrEqual(width - marginX);
        expect(box.y + box.height, `Card ${i} Bottom > 90%`).toBeLessThanOrEqual(height - marginY);
    }
}

test('Viewport Verification: Landscape', async ({ page }, testInfo) => {
    const screenshots = createScreenshotHelper(testInfo);
    // Default landscape: 1280x720
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.click('button:has-text("Start Game")');

    await screenshots.capture(page, "landscape-bounds", {
        programmaticCheck: async () => await verifyCardsWithinBounds(page)
    });
});

test('Viewport Verification: Portrait', async ({ page }, testInfo) => {
    const screenshots = createScreenshotHelper(testInfo);
    // Portrait: 720x1280
    await page.setViewportSize({ width: 720, height: 1280 });
    await page.goto('/');
    await page.click('button:has-text("Start Game")');

    await screenshots.capture(page, "portrait-bounds", {
        programmaticCheck: async () => await verifyCardsWithinBounds(page)
    });
});
