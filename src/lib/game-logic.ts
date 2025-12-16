export type CardShape = 'diamond' | 'squiggle' | 'pill';
export type CardColor = 'red' | 'green' | 'purple';
export type CardShading = 'solid' | 'striped' | 'open';
export type CardCount = 1 | 2 | 3;

export interface Card {
    id: string;
    shape: CardShape;
    color: CardColor;
    shading: CardShading;
    count: CardCount;
}

export const SHAPES: CardShape[] = ['diamond', 'squiggle', 'pill'];
export const COLORS: CardColor[] = ['red', 'green', 'purple'];
export const SHADINGS: CardShading[] = ['solid', 'striped', 'open'];
export const COUNTS: CardCount[] = [1, 2, 3];

export function generateDeck(): Card[] {
    const deck: Card[] = [];
    for (const count of COUNTS) {
        for (const shape of SHAPES) {
            for (const color of COLORS) {
                for (const shading of SHADINGS) {
                    deck.push({
                        id: `${count}-${shape}-${color}-${shading}`,
                        count,
                        shape,
                        color,
                        shading,
                    });
                }
            }
        }
    }
    return shuffle(deck);
}

function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export function isValidSet(c1: Card, c2: Card, c3: Card): boolean {
    if (!c1 || !c2 || !c3) return false;

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

export function findSets(board: Card[]): Card[][] {
    const sets: Card[][] = [];
    for (let i = 0; i < board.length; i++) {
        for (let j = i + 1; j < board.length; j++) {
            for (let k = j + 1; k < board.length; k++) {
                if (isValidSet(board[i], board[j], board[k])) {
                    sets.push([board[i], board[j], board[k]]);
                }
            }
        }
    }
    return sets;
}
