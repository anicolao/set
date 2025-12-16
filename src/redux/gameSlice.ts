import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Card, generateDeck, isValidSet, findSets } from '../lib/game-logic';
import { v4 as uuidv4 } from 'uuid';

export type PlayerPosition = 'bottom' | 'right' | 'top' | 'left';

export interface Player {
    id: string;
    name: string;
    score: number;
    position: PlayerPosition;
}

interface GameState {
    status: 'lobby' | 'playing' | 'game_over';
    deck: Card[];
    board: Card[];
    players: Player[];
    activePlayerId: string | null;
    selection: string[]; // card IDs
    message: string | null; // For UI feedback
    turnExpiresAt: number | null;
    animatingResult: { type: 'success' | 'failure', cardIds: string[], playerId: string } | null;
}

const initialState: GameState = {
    status: 'lobby',
    deck: [],
    board: [],
    players: [],
    activePlayerId: null,
    selection: [],
    message: null,
    turnExpiresAt: null,
    animatingResult: null
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        addPlayer: (state, action: PayloadAction<{ position: PlayerPosition }>) => {
            const { position } = action.payload;
            if (state.players.find(p => p.position === position)) return;

            const id = uuidv4();
            state.players.push({
                id,
                name: `Player ${state.players.length + 1}`,
                score: 0,
                position
            });
        },
        startGame: (state) => {
            if (state.players.length === 0) return;
            state.deck = generateDeck();
            state.board = state.deck.splice(0, 12);
            state.status = 'playing';
            state.selection = [];
            state.activePlayerId = null;
            state.message = 'Game Started! Select 3 cards.';
            state.turnExpiresAt = null;
            state.animatingResult = null;
        },
        claimTurn: (state, action: PayloadAction<string>) => {
            // If someone is already active, ignore
            if (state.activePlayerId) return;
            if (state.status !== 'playing') return;

            const playerId = action.payload;
            state.activePlayerId = playerId;
            state.selection = [];
            state.message = `${state.players.find(p => p.id === playerId)?.name} called SET!`;

            // 10 second timer
            state.turnExpiresAt = Date.now() + 10000;
        },
        selectCard: (state, action: PayloadAction<{ playerId: string, cardId: string }>) => {
            if (state.status !== 'playing') return;
            if (state.animatingResult) return; // Block input during animation

            const { playerId, cardId } = action.payload;

            // STRICT MODE: Must have claimed turn first
            if (state.activePlayerId !== playerId) return;

            // Toggle selection
            if (state.selection.includes(cardId)) {
                state.selection = state.selection.filter(id => id !== cardId);
            } else {
                if (state.selection.length < 3) {
                    state.selection.push(cardId);
                }
            }

            // Check for set upon 3rd selection
            if (state.selection.length === 3) {
                const selectedCards = state.board.filter(c => state.selection.includes(c.id));

                if (selectedCards.length === 3) {
                    const [c1, c2, c3] = selectedCards;
                    const valid = isValidSet(c1, c2, c3);

                    // Enter animation state
                    state.animatingResult = {
                        type: valid ? 'success' : 'failure',
                        cardIds: [...state.selection],
                        playerId
                    };
                    state.turnExpiresAt = null; // Stop timer visual
                } else {
                    // Should happen rarely unless selection logic is buggy
                    state.selection = [];
                }
            }
        },
        resolveTurn: (state) => {
            if (!state.animatingResult) return;

            const { type, cardIds, playerId } = state.animatingResult;
            const player = state.players.find(p => p.id === playerId);

            if (type === 'success') {
                if (player) player.score += 1;
                state.message = 'Set Found!';

                const needsReplacement = state.board.length <= 12 && state.deck.length > 0;

                const newBoard = [...state.board];

                cardIds.forEach(id => {
                    const idx = newBoard.findIndex(c => c && c.id === id);
                    if (idx !== -1) {
                        if (needsReplacement && state.deck.length > 0) {
                            newBoard[idx] = state.deck.pop()!;
                        } else {
                            // Mark for removal
                            newBoard[idx] = null as any;
                        }
                    }
                });
                state.board = newBoard.filter(c => c !== null);

                // GAME OVER CHECK
                if (state.deck.length === 0) {
                    const sets = findSets(state.board);
                    if (sets.length === 0) {
                        state.status = 'game_over';
                        state.message = 'Game Over! No more sets.';
                    }
                }

            } else {
                // Failure
                if (player) player.score = Math.max(0, player.score - 1);
                state.message = 'Invalid Set!';
            }

            // Cleanup
            state.animatingResult = null;
            state.activePlayerId = null;
            state.selection = [];
            state.turnExpiresAt = null;
        },
        expireTurn: (state) => {
            if (!state.activePlayerId) return;

            // Penalty for timeout? treating as invalid set for simplicity or just no score change?
            // "add a time limit... pulsing faster... runs out".
            // Implementation plan said "Apply penalty".
            const player = state.players.find(p => p.id === state.activePlayerId);
            if (player) {
                player.score = Math.max(0, player.score - 1);
            }
            state.message = 'Time out!';

            state.activePlayerId = null;
            state.selection = [];
            state.turnExpiresAt = null;
        },
        dealMore: (state) => {
            if (state.deck.length >= 3) {
                state.board.push(...state.deck.splice(0, 3));
            }
        },
        resetGame: (state) => {
            state.status = 'lobby';
            state.board = [];
            state.selection = [];
            state.activePlayerId = null;
            state.deck = [];
            state.players.forEach(p => p.score = 0);
            state.turnExpiresAt = null;
            state.animatingResult = null;
        },
        restartGame: (state) => {
            if (state.players.length === 0) return;
            state.deck = generateDeck();
            state.board = state.deck.splice(0, 12);
            state.status = 'playing';
            state.selection = [];
            state.activePlayerId = null;
            state.message = 'Game Valid! Select 3 cards.';
            state.turnExpiresAt = null;
            state.animatingResult = null;
            state.players.forEach(p => p.score = 0);
        },
        leaveGame: (state) => {
            state.status = 'lobby';
            state.board = [];
            state.selection = [];
            state.activePlayerId = null;
            state.deck = [];
            state.players = []; // CLEAR PLAYERS
            state.turnExpiresAt = null;
            state.animatingResult = null;
        }
    }
});

export const { addPlayer, startGame, selectCard, dealMore, resetGame, restartGame, claimTurn, resolveTurn, expireTurn, leaveGame } = gameSlice.actions;
export default gameSlice.reducer;
