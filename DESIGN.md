# Set Tabletop Game - Design Document

## 1. Overview
This document outlines the design and implementation strategy for a digital tabletop version of the card game "Set". The application is designed for large touchscreen displays with a multi-directional interface to support players gathered around the device.

## 2. Architecture

### 2.1 Tech Stack
-   **Framework**: Svelte (Vite-based)
-   **State Management**: Redux (using `@reduxjs/toolkit` generally or standard `redux` as seen in `quortextt`)
-   **UI library**: Native DOM components (Svelte)
-   **Styling**: CSS / SCSS (Global + Component scoped)
-   **Testing**: Playwright (E2E), Vitest (Unit)

### 2.2 Application Structure
Unlike `quortextt` which appears to use custom Canvas rendering, **Set** will utilize Svelte's efficient DOM updates and CSS for rendering cards and animations. This ensures accessibility, ease of styling, and crisp text/graphics at any resolution.

```
src/
├── components/
│   ├── Card.svelte       # SVG/CSS representation of a card
│   ├── GameBoard.svelte  # Grid layout for active cards
│   ├── PlayerHud.svelte  # Rotated player controls (Score, "Set" button)
│   └── Tabletop.svelte   # Main container managing layout and rotation
├── redux/
│   ├── store.ts          # Redux store configuration
│   ├── gameReducer.ts    # Core game logic (deck, board, players)
│   ├── actions.ts        # Action definitions
│   └── selectors.ts      # Data selection helprs
├── lib/
│   ├── game-logic.ts     # Pure functions for Set rules (isValidSet, findSets)
│   └── card-utils.ts     # Card generation and attribute mapping
└── App.svelte            # Root component
```

## 3. Game State & Logic (Redux)

The `gameReducer` will manage the single source of truth.

### 3.1 State Shape
```typescript
interface Card {
  id: string;
  count: 1 | 2 | 3;
  color: 'red' | 'green' | 'purple';
  shape: 'diamond' | 'squiggle' | 'pill';
  shading: 'solid' | 'striped' | 'open';
}

interface Player {
  id: string;
  name: string;
  score: number;
  position: 'bottom' | 'top' | 'left' | 'right'; // For UI orientation
  isActive: boolean; // If true, this player is currently selecting cards
}

interface GameState {
  status: 'lobby' | 'playing' | 'game_over';
  deck: Card[];
  board: Card[]; // The 12+ cards currently visible
  players: Player[];
  activePlayerId: string | null; // ID of player attempting to claim a set
  selection: string[]; // IDs of currently selected cards
  selectionTimer: number | null; // Timestamp/Countdown for turn expiration
}
```

### 3.2 Key Mechanics
1.  **Claiming a Set**: To prevent race conditions (two players tapping cards simultaneously), we will implement a **Buzzer System**.
    *   Players have a dedicated "SET" button in their HUD.
    *   Pressing "SET" locks the board for other players and makes that player the `activePlayer`.
    *   The active player has a short window (e.g., 5 seconds) to tap 3 cards.
    *   If correct: Score increases, cards replaced, lock releases.
    *   If incorrect/timeout: Score decreases, lock releases.
2.  **Card Rendering**: Cards will be rendered using SVG to ensure perfect scaling and specific shapes (Squiggle, Diamond, Pill) matching the reference design.
3.  **No Sets**: If no sets exist on the board, the system should automatically (or via button) deal 3 more cards.

## 4. UI/UX Design

### 4.1 Card Design
Based on the reference graphic:
-   **Shapes**: Pill (Rounded Rectangle), Squiggle (Wave), Diamond.
-   **Colors**: Vibrant Green, Purple, Red.
-   **Fills**:
    -   *Solid*: Full color fill.
    -   *Striped*: Vertical or Diagonal hatching.
    -   *Open*: Colored outline, transparency inside.
-   **Layout**: Cards on white background, distinct borders.

### 4.2 Tabletop Layout
-   **Center**: The 3x4 (or 3x5) card grid. Rotatable or omni-directional?
    -   Standard layouts usually favor one orientation, but for tabletop, cards should be legible from all sides.
    -   Proposal: Cards are symmetric enough to be read from any angle.
-   **Edges**: Player HUDS attached to the bezel.
    -   Bottom: Player 1 (0° rotation)
    -   Right: Player 2 (270° rotation)
    -   Top: Player 3 (180° rotation)
    -   Left: Player 4 (90° rotation)

## 5. Testing Strategy

### 5.1 End-to-End (Playwright)
Following `quortextt` and repository standards:
-   **Browser Config**: Strict font rendering flags (`--font-render-hinting=none`, etc.) to ensure consistent screenshots across environments.
-   **Visual Regression**:
    -   Use `createScreenshotHelper` (from repo strategy).
    -   Capture snapshots of the initial deal, mid-game selection, and "Game Over" states.
    -   **Critical**: Ensure animations are disabled or finished before snapshots.
-   **Interaction Testing**:
    -   Simulate multi-player flow: Player 1 clicks "SET" -> Selects 3 correct cards -> Verify Score Update.
    -   Verify blocking: Player 1 clicks "SET" -> Player 2 cannot select.

### 5.2 Unit Testing (Vitest)
-   Test `game-logic.ts` exhaustively:
    -   `isValidSet(cardA, cardB, cardC)`: Check all combinations.
    -   `findSets(board)`: Ensure the "No Sets" detection works correctly.

## 6. Implementation Plan - Phase 1 (Core)

1.  **Project Setup**: Initialize Svelte + Redux + Playwright.
2.  **Core Logic**: Implement `isValidSet` and Redux store.
3.  **UI Shell**: Create `Tabletop` layout and `Card` component (SVG).
4.  **Game Loop**: Connect store to UI, implement "Deal" and "Select" actions.
5.  **Multiplayer logic**: Add "Join" and "Buzzer" logic.
6.  **Verification**: Write E2E tests for a full game loop.

## 7. Repository Policy Compliance
-   **Branching**: All work on `feature/` branches.
-   **Verification**: All PRs must include passing E2E tests + Visual Artifacts (README + Screenshots).
-   **Formatting**: Pre-commit `npm run format` & `npm run check`.
