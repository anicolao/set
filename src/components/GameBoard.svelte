<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card as CardType } from '../lib/game-logic';
  import Card from './Card.svelte';
  
  export let cards: CardType[];
  export let selection: string[];
  export let invalidIds: string[] = [];
  export let flyingIds: string[] = [];
  export let flyDirection: 'bottom' | 'top' | 'left' | 'right' | null = null;
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
        invalid={invalidIds.includes(card.id)}
        flying={flyingIds.includes(card.id)}
        flyDirection={flyingIds.includes(card.id) ? flyDirection : null}
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
  .board.portrait {
     grid-template-columns: repeat(3, 1fr);
     grid-template-rows: repeat(4, 1fr);
     aspect-ratio: 1 / 2;
     /* Strict dimensions matching 1:2 ratio constrained by 50vh height */
     height: min(50vh, 160vw);
     width: min(25vh, 80vw); 
  }

  /* 
     Landscape: Ratio 2:1
     Width <= 80vw
     Height = Width * 0.5 <= 70vh => Width <= 140vh
     So Width = min(80vw, 140vh)
  */
  .board.landscape {
     grid-template-columns: repeat(4, 1fr);
     grid-template-rows: repeat(3, 1fr);
     aspect-ratio: 2 / 1;
     /* Strict dimensions matching 2:1 ratio constrained by 50vh height */
     width: min(80vw, 100vh);
     height: min(40vw, 50vh);
  }
  
  .card-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
  }
</style>
