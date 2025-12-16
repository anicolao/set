
import { test, expect, Page } from '@playwright/test';

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
    test.setTimeout(120000); // Allow 2 minutes for a full game

    test('play a full game with 2 players', async ({ page }) => {
        // 1. Setup: Load game with specific seed
        console.log("Navigating to game with seed...");
        await page.goto('/?seed=playthrough-seed-12345');

        // 2. Players Join
        console.log("Joining players...");
        const p1Join = page.locator('.bottom button.join');
        const p2Join = page.locator('.top button.join');

        await p1Join.click();
        await expect(page.locator('.bottom .name')).toContainText('Player 1');


        // Wait a beat before joining player 2 to avoid any race conditions if they exist

        await p2Join.click();
        await expect(page.locator('.top .name')).toContainText('Player 2');

        // 3. Start Game
        console.log("Starting game...");
        await page.click('button:has-text("Start Game")');
        await expect(page.locator('.board')).toBeVisible();

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
                for (const id of setIds) {

                    // Force click to ensure valid interaction even if layout is tight
                    const cardLocator = page.locator(`div[data-testid="${id}"]`);
                    await cardLocator.click({ force: true });
                    // Verify selection state instead of waiting
                    // Note: Class might be 'card selected ...'
                    await expect(cardLocator).toHaveClass(/selected/);
                }

                // Wait for cards to be replaced or removed
                await expect(async () => {
                    // Fail fast if Invalid Set detected
                    if (await page.locator('text=Invalid Set!').isVisible()) {
                        console.error('Invalid Set detected!');
                        // Capture snapshot if possible or just throw
                        throw new Error("Game reported Invalid Set!");
                    }

                    const currentCards = await getBoardCards(page);
                    const currentIds = currentCards.map(c => c.id);
                    // Check if *any* of the set cards are missing
                    const anyMissing = setIds.some(id => !currentIds.includes(id));
                    if (!anyMissing) {
                        console.log("Waiting for cards to disappear... Current Board:", currentIds.length);
                    }
                    expect(anyMissing).toBe(true);
                }).toPass({ timeout: 5000 });
                // Check if we can deal more
                const dealButton = page.locator('button:has-text("Deal More")');
                const isDisabled = await dealButton.isDisabled(); // Or check visibility? 

                // App.svelte: <button on:click={() => store.dispatch(dealMore())}>Deal More</button>
                // It doesn't explicitly disable unless deck is empty? 
                // redux/gameSlice.ts: `if (state.deck.length >= 3)`
                // But the UI doesn't show deck count directly?
                // Wait, if no set on board, usually we must deal more.

                // Try dealing more
                if (!isDisabled) {
                    // Deal More logic might be hidden if deck is empty?
                    // Currently UI shows button always?

                    await dealButton.click();
                    // Verify board size increased?
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const newCount = await page.locator('.card').count();
                    if (newCount <= cards.length) {
                        // Deck empty and no sets -> Game Over condition?
                        // Current logic doesn't seemingly have explicit "Game Over" screen in `App.svelte` other than reset?
                        // It just stops?
                        // If no sets and no cards in deck, game is effectively over.
                        console.log("Deck empty and no sets found. Game Over.");
                        gameActive = false;
                    }
                } else {
                    console.log("Deal More disabled. Game Over.");
                    gameActive = false;
                }
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

        expect(p1Score + p2Score).toBeGreaterThan(0);
    });
});
