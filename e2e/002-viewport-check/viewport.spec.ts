import { test, expect, Page } from '@playwright/test';
import { createScreenshotHelper } from '../helpers/screenshot-helper';
import { TestDocumentationHelper } from '../helpers/test-documentation-helper';
import * as path from 'path';

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
        expect(box.x, `Card ${i} X < 10%`).toBeGreaterThanOrEqual(marginX - 1); // Allow small rounding error
        expect(box.y, `Card ${i} Y < 10%`).toBeGreaterThanOrEqual(marginY - 1);

        // Bottom-Right
        expect(box.x + box.width, `Card ${i} Right > 90%`).toBeLessThanOrEqual(width - marginX + 1);
        expect(box.y + box.height, `Card ${i} Bottom > 90%`).toBeLessThanOrEqual(height - marginY + 1);
    }
}

test('Viewport Verification', async ({ page }, testInfo) => {
    const screenshots = createScreenshotHelper(testInfo);
    const docHelper = new TestDocumentationHelper(path.dirname(testInfo.file));

    docHelper.setMetadata(
        "Viewport Boundary Verification",
        "Verifies that the game board and cards strictly fit within the 80% safe zone (10% margins) in both Landscape and Portrait orientations."
    );

    // 1. Landscape Verification
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Players must join
    await page.click('.bottom button.join');
    await page.click('.top button.join');

    await page.click('button:has-text("Start Game")');

    // Wait for board to acquire landscape class (reactivity check)
    await expect(page.locator('.board')).toHaveClass(/landscape/);
    // Wait a bit for layout reflow
    await page.waitForTimeout(500);

    const landscapeVerifications = [
        { description: 'Viewport set to 1280x720', check: async () => { } },
        { description: 'All cards within 10-90% bounds', check: async () => { } }
    ];
    docHelper.addStep("Landscape Orientation", "001-landscape.png", landscapeVerifications);

    await screenshots.capture(page, "landscape", {
        programmaticCheck: async () => await verifyCardsWithinBounds(page)
    });

    // 2. Portrait Verification
    await page.setViewportSize({ width: 720, height: 1280 });
    // Wait for board to acquire portrait class
    await expect(page.locator('.board')).toHaveClass(/portrait/);
    await page.waitForTimeout(500); // Small buffer for layout shift

    const portraitVerifications = [
        { description: 'Viewport set to 720x1280', check: async () => { } },
        { description: 'All cards within 10-90% bounds', check: async () => { } }
    ];
    docHelper.addStep("Portrait Orientation", "002-portrait.png", portraitVerifications);

    await screenshots.capture(page, "portrait", {
        programmaticCheck: async () => await verifyCardsWithinBounds(page)
    });

    docHelper.writeReadme();
});

test('Dynamic Resize Verification', async ({ page }) => {
    // Start Landscape
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Players join to make HUD active/visible state relevant
    await page.click('.bottom button.join');
    await page.click('.top button.join');
    await page.click('button:has-text("Start Game")');

    // Verify Landscape
    await expect(page.locator('.board')).toHaveClass(/landscape/);

    // Resize to Portrait dynamically
    await page.setViewportSize({ width: 720, height: 1280 });
    // Should adapt automatically
    await expect(page.locator('.board')).toHaveClass(/portrait/);

    // Verify strict bounds again after resize
    const viewport = page.viewportSize();
    const width = viewport!.width;
    const height = viewport!.height;
    const marginX = width * 0.1;
    const marginY = height * 0.1;

    const cards = await page.locator('.card').all();
    for (const [i, card] of cards.entries()) {
        const box = await card.boundingBox();
        if (!box) continue;
        expect(box.x).toBeGreaterThanOrEqual(marginX - 2);
        expect(box.y).toBeGreaterThanOrEqual(marginY - 2);
    }
});
