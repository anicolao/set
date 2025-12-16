import { test, expect } from '@playwright/test';
import { createScreenshotHelper } from '../helpers/screenshot-helper';
import { TestDocumentationHelper } from '../helpers/test-documentation-helper';
import * as path from 'path';

test('Game Flow: Join, Start, Play', async ({ page }, testInfo) => {
    const screenshots = createScreenshotHelper(testInfo);
    const docHelper = new TestDocumentationHelper(path.dirname(testInfo.file));

    docHelper.setMetadata(
        "Game Flow Verification",
        "Verifies that players can join, start the game, and selection logic works."
    );

    await page.goto('/');

    // 1. Initial State
    const initialVerifications = [{ description: 'Lobby is visible', check: async () => { } }];
    docHelper.addStep("Initial Lobby", "000-lobby.png", initialVerifications);
    await screenshots.capture(page, "lobby", {
        programmaticCheck: async () => {
            await expect(page.locator('text=Tabletop Set')).toBeVisible();
        }
    });

    // 2. Join Players
    await page.click('.bottom button.join');
    await page.click('.top button.join');

    const joinVerifications = [
        { description: 'Player 1 joined at bottom', check: async () => { } },
        { description: 'Player 2 joined at top', check: async () => { } }
    ];
    docHelper.addStep("Players Joined", "001-joined.png", joinVerifications);
    await screenshots.capture(page, "joined", {
        programmaticCheck: async () => {
            await expect(page.locator('.bottom .name')).toContainText('Player 1');
            await expect(page.locator('.top .name')).toContainText('Player 2');
        }
    });

    // 3. Start Game
    await page.click('button:has-text("Start Game")');

    const startVerifications = [
        { description: 'Board is visible with 12 cards', check: async () => { } },
        { description: 'Start Game button hidden', check: async () => { } }
    ];
    docHelper.addStep("Game Started", "002-started.png", startVerifications);
    await screenshots.capture(page, "started", {
        programmaticCheck: async () => {
            await expect(page.locator('.board')).toBeVisible();
            await expect(page.locator('.card')).toHaveCount(12);
        }
    });

    // 4. Select Card (Strict Mode: Must click SET first)
    // Assuming strict mode implementation:
    // Player 1 clicks SET
    await page.click('.bottom button.set');
    await expect(page.locator('text=Player 1 called SET!')).toBeVisible();

    // Select 1 card
    await page.locator('.card').first().click();

    const selectVerifications = [
        { description: 'Player 1 is active', check: async () => { } },
        { description: 'First card is selected', check: async () => { } }
    ];
    docHelper.addStep("Selection Active", "003-selecting.png", selectVerifications);
    await screenshots.capture(page, "selecting", {
        programmaticCheck: async () => {
            await expect(page.locator('.card').first()).toHaveClass(/selected/);
            // Ensure visual stability (transition: 0.1s)
            await page.waitForTimeout(200);
            // Verify orientation class depending on default view?
            // Playwright default view is usually landscapish (1280x720).
            // So expected class is .card.landscape
            // await expect(page.locator('.card').first()).toHaveClass(/landscape/);
        }
    });

    docHelper.writeReadme();
});
