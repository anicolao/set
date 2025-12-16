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
     Portrait: Ratio 1:2 (3 cols, 4 rows * 2/3 card ratio = 6w/12h reduced to 1/2)
     Height <= 80vh
     Width = Height * 0.5 <= 80vw => Height <= 160vw
     So Height = min(80vh, 160vw)
  */
  .board.portrait {
     grid-template-columns: repeat(3, 1fr);
     aspect-ratio: 1 / 2;
     height: min(80vh, 160vw);
     width: auto; 
  }

  /* 
     Landscape: Ratio 2:1 (4 cols, 3 rows * 3/2 card ratio = 12w/6h reduced to 2/1)
     Width <= 80vw
     Height = Width * 0.5 <= 80vh => Width <= 160vh
     So Width = min(80vw, 160vh)
  */
  .board.landscape {
     grid-template-columns: repeat(4, 1fr);
     aspect-ratio: 2 / 1;
     width: min(80vw, 160vh);
     height: auto;
  }
  
  .card-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
  }
</style>
