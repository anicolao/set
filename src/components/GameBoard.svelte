<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card as CardType } from '../lib/game-logic';
  import Card from './Card.svelte';
  
  export let cards: CardType[];
  export let selection: string[];
  
  const dispatch = createEventDispatcher();
</script>

<div class="board">
  {#each cards as card (card.id)}
    <div class="card-wrapper">
      <Card 
        {card} 
        selected={selection.includes(card.id)} 
        on:click={(e) => dispatch('select', e.detail)}
      />
    </div>
  {/each}
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3x4 layout */
    gap: 15px;
    width: 100%;
    max-width: 600px;
    padding: 20px;
    background: #eee;
    border-radius: 12px;
  }
  
  .card-wrapper {
      /* Animation hook */
  }
</style>
