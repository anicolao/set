<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card as CardType } from '../lib/game-logic';
  import Card from './Card.svelte';
  
  export let cards: CardType[];
  export let selection: string[];
  export let orientation: 'landscape' | 'portrait' = 'portrait';
  

  const dispatch = createEventDispatcher();

  $: count = cards.length;
  $: isLandscape = orientation === 'landscape';
  
  // Dynamic columns:
  // Portrait: 3 fixed.
  // Landscape: 4 fixed (unless we want to grow cols? Standard Set is 3x4 or 4x3. If 15 cards -> 3x5 or 5x3).
  // Let's stick to standard behavior:
  // Portrait: Always 3 cols. Rows = ceil(count/3).
  // Landscape: Always 4 cols? OR 3 rows and variable cols?
  // User "Layout Refinement" conversation implied staying within bounds.
  // Standard Set with 15 cards: usually 3x5.
  // Let's implement:
  // Portrait: 3 cols.
  // Landscape: 4 cols (try to keep 4x3 ratio? 15 cards -> 4 cols -> 4 rows (last row 3 items)).
  //            OR 5 cols -> 3 rows?
  // Let's use:
  // Portrait: 3 cols.
  // Landscape: 4 cols.
  


  $: cols = isLandscape ? 4 : 3;
  $: rows = Math.ceil(count / cols);
</script>

<div class="board {orientation}" style="--cols: {cols}; --rows: {rows};">
  {#each cards as card (card.id)}
    <div class="card-wrapper">
      <Card 
        {card} 
        {orientation}
        selected={selection.includes(card.id)} 
        on:click={(e) => dispatch('select', e.detail)}
      />
    </div>
  {/each}
</div>

<style>
  .board {
    display: grid;
    /* Center in parent */
    margin: auto;
    justify-content: center;
    align-content: center;
    
    gap: 2vmin;
    padding: 0;
    
    /* Ensure it never overflows */
    box-sizing: border-box;
  }
  
  /* 
     Portrait: Ratio 1:2
     Height <= 70vh (Leave room for controls)
     Width = Height * 0.5 <= 80vw => Height <= 160vw
     So Height = min(70vh, 160vw)
  */

  /* 
     Portrait: Ratio 3:4 (approx)
     Constraint: 80vw width, 60vh height. 
  */

  /* 
     Portrait: Ratio 3:4 (approx)
     Constraint: 80vw width, 60vh height. 
  */
  .board.portrait {
     --cols: 3;
     --rows: 4;
     --card-ratio: 0.666; /* 2/3 */

     aspect-ratio: calc(var(--cols) * var(--card-ratio)) / var(--rows);
     
     /* Simple constraint */
     height: 100%;
     width: auto;
     max-height: 50vh;
     max-width: 70vw;

     grid-template-columns: repeat(var(--cols), 1fr);
     grid-template-rows: repeat(var(--rows), 1fr);
  }

  /* 
     Landscape: Ratio 4:3 (approx)
     Constraint: 80vw width, 60vh height.
  */
  .board.landscape {
     --cols: 4;
     --rows: 3;
     --card-ratio: 1.5; /* 3/2 */

     aspect-ratio: calc(var(--cols) * var(--card-ratio)) / var(--rows);

     /* Simple constraint */
     height: 100%;
     width: auto;
     max-height: 50vh;
     max-width: 70vw;

     grid-template-columns: repeat(var(--cols), 1fr);
     grid-template-rows: repeat(var(--rows), 1fr);
  }
  
  .card-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
  }
</style>
