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
}

const initialState: GameState = {
    status: 'lobby',
    deck: [],
    board: [],
    players: [],
    activePlayerId: null,
    selection: [],
    message: null
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
        },
        claimTurn: (state, action: PayloadAction<string>) => {
            // If someone is already active, ignore
            if (state.activePlayerId) return;

            const playerId = action.payload;
            state.activePlayerId = playerId;
            state.selection = [];
            state.message = `${state.players.find(p => p.id === playerId)?.name} called SET!`;
            // In a real game, set a timer here
        },

        selectCard: (state, action: PayloadAction<{ playerId: string, cardId: string }>) => {
            if (state.status !== 'playing') return;
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
                    if (isValidSet(c1, c2, c3)) {
                        // Found a set!
                        const player = state.players.find(p => p.id === playerId);
                        if (player) player.score += 1;

                        const needsReplacement = state.board.length <= 12 && state.deck.length > 0;

                        // Create new board array to preserve order
                        const newBoard = [...state.board];

                        state.selection.forEach(id => {
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
                        state.message = 'Set Found!';

                        // Check Game Over
                        if (state.deck.length === 0 && findSets(state.board).length === 0) {
                            state.status = 'game_over';
                            state.message = 'Game Over!';
                        }
                    } else {
                        // Invalid Set
                        const player = state.players.find(p => p.id === playerId);
                        if (player) player.score = Math.max(0, player.score - 1);
                        state.message = 'Invalid Set!';
                    }
                }
                // Reset turn
                state.activePlayerId = null;
                state.selection = [];
            }
        },
        dealMore: (state) => {
            // Only allowed if no sets on board
            if (findSets(state.board).length > 0) {
                state.message = "There is a set on the board!";
                return;
            }

            if (state.deck.length >= 3) {
                state.board.push(...state.deck.splice(0, 3));
            } else {
                // Deck empty, cannot deal more.
                // If no sets (checked above) and no deck -> Game Over
                if (state.deck.length === 0 && findSets(state.board).length === 0) {
                    state.status = 'game_over';
                    state.message = 'Game Over!';
                }
            }
        },
        resetGame: (state) => {
            state.status = 'lobby';
            state.board = [];
            state.selection = [];
            state.activePlayerId = null;
            state.players.forEach(p => p.score = 0);
        }
    }
});

export const { addPlayer, startGame, selectCard, dealMore, resetGame, claimTurn } = gameSlice.actions;
export default gameSlice.reducer;
