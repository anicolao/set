

import { test, expect, Page } from '@playwright/test';
import { createScreenshotHelper } from '../helpers/screenshot-helper';
import { TestDocumentationHelper } from '../helpers/test-documentation-helper';
import * as path from 'path';

// --- Game Logic Replication ---

type Card = {
    id: string; // "count-shape-color-shading"
    count: number;
    shape: string;
    color: string;
    shading: string;
};

// Re-implement isValidSet from src/lib/game-logic.ts
function isValidSet(c1: Card, c2: Card, c3: Card): boolean {
    const attrs = [
        [c1.count, c2.count, c3.count],
        [c1.shape, c2.shape, c3.shape],
        [c1.color, c2.color, c3.color],
        [c1.shading, c2.shading, c3.shading],
    ];

    return attrs.every(attr => {
        const unique = new Set(attr as any[]);
        return unique.size === 1 || unique.size === 3;
    });
}

function findSet(board: Card[]): string[] | null {
    for (let i = 0; i < board.length; i++) {
        for (let j = i + 1; j < board.length; j++) {
            for (let k = j + 1; k < board.length; k++) {
                if (isValidSet(board[i], board[j], board[k])) {
                    return [board[i].id, board[j].id, board[k].id];
                }
            }
        }
    }
    return null;
}

function parseCardId(id: string): Card {
    const parts = id.split('-');
    // format: count-shape-color-shading
    // e.g. 1-diamond-red-solid
    // BUT: shape could be multi-part? No, 'diamond', 'squiggle', 'pill'.
    return {
        id,
        count: parseInt(parts[0], 10),
        shape: parts[1],
        color: parts[2],
        shading: parts[3]
    };
}

async function getBoardCards(page: Page): Promise<Card[]> {
    const locators = await page.locator('.card').all();
    const cards: Card[] = [];
    for (const loc of locators) {
        const id = await loc.getAttribute('data-testid');
        if (id) {
            cards.push(parseCardId(id));
        }
    }
    return cards;
}

test.describe('Complete Playthrough', () => {
    test.setTimeout(180000); // Allow 3 minutes for a full game with screenshots

    test('play a full game with 2 players', async ({ page }, testInfo) => {
        const screenshots = createScreenshotHelper(testInfo);
        const docHelper = new TestDocumentationHelper(path.dirname(testInfo.file));

        docHelper.setMetadata(
            "Seeded Playthrough Verification",
            "Verifies a complete game playthrough with two players using a deterministic seed. Validates game logic, turn taking, and win conditions."
        );


        // 1. Setup: Load game with specific seed
        console.log("Navigating to game with seed...");
        await page.goto('/?seed=playthrough-seed-12345');

        await screenshots.capture(page, 'initial-load', {
            programmaticCheck: async () => {
                await expect(page.locator('.lobby')).toBeVisible();
            }
        });
        docHelper.addStep("Initial Load", "000-initial-load.png", [
            { description: "Lobby is visible" }
        ]);

        // 2. Players Join
        console.log("Joining players...");
        const p1Join = page.locator('.bottom button.join');
        const p2Join = page.locator('.top button.join');

        await p1Join.click();

        await screenshots.capture(page, 'player-1-joined', {
            programmaticCheck: async () => {
                await expect(page.locator('.bottom .name')).toContainText('Player 1');
            }
        });
        docHelper.addStep("Player 1 Joined", "001-player-1-joined.png", [
            { description: "Player 1 HUD shows name" }
        ]);

        await p2Join.click();

        await screenshots.capture(page, 'player-2-joined', {
            programmaticCheck: async () => {
                await expect(page.locator('.top .name')).toContainText('Player 2');
            }
        });
        docHelper.addStep("Player 2 Joined", "002-player-2-joined.png", [
            { description: "Player 2 HUD shows name" }
        ]);

        // 3. Start Game
        console.log("Starting game...");
        await page.click('button:has-text("Start Game")');

        await screenshots.capture(page, 'game-started', {
            programmaticCheck: async () => {
                await expect(page.locator('.board')).toBeVisible();
                const count = await page.locator('.card').count();
                expect(count).toBe(12);
            }
        });
        docHelper.addStep("Game Started", "003-game-started.png", [
            { description: "Board is visible" },
            { description: "12 cards are dealt" }
        ]);

        let gameActive = true;
        let turnCount = 0;

        while (gameActive) {
            turnCount++;

            // Get current board state
            const cards = await getBoardCards(page);
            console.log(`Turn ${turnCount}: Board has ${cards.length} cards.`);
            console.log(`Board IDs: ${cards.map(c => c.id).join(', ')}`);

            // Find valid set
            const setIds = findSet(cards);

            if (setIds) {
                console.log(`Found Set: ${setIds.join(', ')}`);

                // Active player claims turn
                // Alternate turns between Player 1 (bottom) and Player 2 (top)
                const playerSelector = turnCount % 2 !== 0 ? '.bottom' : '.top';
                const playerName = turnCount % 2 !== 0 ? 'Player 1' : 'Player 2';

                console.log(`Turn ${turnCount}: ${playerName} clicking SET`);
                await page.locator(`${playerSelector} button.set`).click();
                await expect(page.locator(`text=${playerName} called SET!`)).toBeVisible();

                // Select cards
                console.log(`Turn ${turnCount}: Selecting cards...`);
                for (let i = 0; i < setIds.length; i++) {
                    const id = setIds[i];



                    const cardLocator = page.locator(`div[data-testid="${id}"]`);

                    // Click top-left to avoid potential overlap with HUDs
                    await cardLocator.click({ position: { x: 10, y: 10 } });

                    // Long delay to ensure state settles
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Only verify selection for the first 2 cards. 
                    // The 3rd card click immediately triggers set processing/removal.
                    if (i < 2) {
                        await expect(cardLocator).toHaveClass(/selected/);
                    }
                }

                // Wait for cards to be replaced or removed
                await expect(async () => {
                    // Fail fast if Invalid Set detected
                    if (await page.locator('text=Invalid Set!').isVisible()) {
                        console.error('Invalid Set detected!');
                        // Capture failure state
                        await screenshots.capture(page, `turn-${turnCount}-invalid`, {});
                        throw new Error("Game reported Invalid Set!");
                    }

                    const currentCards = await getBoardCards(page);
                    const currentIds = currentCards.map(c => c.id);
                    // Check if *any* of the set cards are missing
                    const anyMissing = setIds.some(id => !currentIds.includes(id));

                    expect(anyMissing).toBe(true);
                }).toPass({ timeout: 5000 });

                // Capture turn result
                // We limit screenshots to first 3 turns and then every 5th turn to avoid exploding file count?
                // User said "every step". Let's do every turn. The index auto-increments.
                await screenshots.capture(page, `turn-${turnCount}-complete`, {
                    programmaticCheck: async () => {
                        const currentCards = await getBoardCards(page);
                        const setStillPresent = setIds.every(id => currentCards.find(c => c.id === id));
                        expect(setStillPresent).toBe(false);
                    }
                });
                docHelper.addStep(`Turn ${turnCount} Complete`, `${String(screenshots['count'] - 1).padStart(3, '0')}-turn-${turnCount}-complete.png`, [
                    { description: `${playerName} found a set: ${setIds.join(', ')}` },
                    { description: "Cards were removed/replaced" }
                ]);

                // Check if we can deal more
                const dealButton = page.locator('button:has-text("Deal More")');
                const isDisabled = await dealButton.isDisabled();

                // Try dealing more
                if (!isDisabled) {
                    // Deal More logic might be hidden if deck is empty?
                    // Currently UI shows button always?

                    await dealButton.click();
                    // Verify board size increased?
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const newCount = await page.locator('.card').count();

                    if (newCount > cards.length) {
                        // We dealt more cards
                        await screenshots.capture(page, `turn-${turnCount}-dealt-more`, {});
                        docHelper.addStep(`Turn ${turnCount} Dealt More`, `${String(screenshots['count'] - 1).padStart(3, '0')}-turn-${turnCount}-dealt-more.png`, [
                            { description: "Board size increased" }
                        ]);
                    }

                    if (newCount <= cards.length) {
                        // Deck empty and no sets -> Game Over condition?
                        console.log("Deck empty and no sets found. Game Over.");
                        gameActive = false;
                    }
                } else {
                    console.log("Deal More disabled. Game Over.");
                    gameActive = false;
                }
            } else {
                console.log("No sets found on board (and deal more failed logic?). Game Over.");
                gameActive = false;
            }

            // fail safe for infinite loop
            if (turnCount > 100) {
                throw new Error("Game loop exceeded 100 turns, likely stuck.");
            }
        }

        // Verify scores are non-zero (unless it was a really weird game)
        const p1ScoreText = await page.locator('.bottom .score').textContent();
        const p2ScoreText = await page.locator('.top .score').textContent();

        console.log(`Final Scores - P1: ${p1ScoreText}, P2: ${p2ScoreText}`);

        const p1Score = parseInt(p1ScoreText?.replace('Score: ', '') || '0');
        const p2Score = parseInt(p2ScoreText?.replace('Score: ', '') || '0');

        await screenshots.capture(page, 'game-over', {
            programmaticCheck: async () => {
                expect(p1Score + p2Score).toBeGreaterThan(0);
            }
        });
        docHelper.addStep("Game Over", `${String(screenshots['count'] - 1).padStart(3, '0')}-game-over.png`, [
            { description: `Final Scores: P1=${p1Score}, P2=${p2Score}` }
        ]);

        docHelper.writeReadme();
    });
});
