<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card as CardType } from '../lib/game-logic';
  import Card from './Card.svelte';
  
  export let cards: CardType[];
  export let selection: string[];
  export let orientation: 'landscape' | 'portrait' = 'portrait';
  
  const dispatch = createEventDispatcher();
</script>

<div class="board {orientation}">
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
    gap: 1.5vmin; /* Use vmin for responsive gap */
    width: 60vw;  /* Default width constraint */
    max-width: 80vw;
    max-height: 80vh;
    padding: 20px;
    background: rgba(238, 238, 238, 0.9);
    border-radius: 12px;
    box-sizing: border-box;
    /* Center in parent */
    margin: auto; 
    justify-content: center;
    align-content: center;
  }
  
  .board.portrait {
     grid-template-columns: repeat(3, 1fr);
     width: 80vw;
     height: auto;
     aspect-ratio: 3/4; /* Roughly matches 3 cols of 2:3 cards */
  }

  .board.landscape {
     grid-template-columns: repeat(4, 1fr);
     width: auto;
     height: 80vh;
     aspect-ratio: 4/3; /* Roughly matches 4 cols of 3:2 cards? 
                          Wait: 4 cols * 3 width = 12. 3 rows * 2 height = 6. 
                          Ratio = 12/6 = 2. 
                          Let's relax aspect ratio and let grid handle it. */
     aspect-ratio: 2/1; 
  }

  
  .card-wrapper {
      /* Animation hook */
      display: contents; 
  }
</style>
