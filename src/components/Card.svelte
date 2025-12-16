<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card } from '../lib/game-logic';
  
  export let card: Card;
  export let selected: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  const COLORS: Record<string, string> = {
    red: '#e74c3c',
    green: '#27ae60',
    purple: '#8e44ad'
  };

  $: color = COLORS[card.color];
  $: fillId = `pattern-${card.color}`;
  
  // Shape Paths (Normalized to 100x50 box approx)
  const DIAMOND = "M 10,25 L 50,5 L 90,25 L 50,45 Z";
  const PILL = "M 15,10 L 85,10 A 15,15 0 0 1 85,40 L 15,40 A 15,15 0 0 1 15,10 Z";
  // Simplified squiggle approximation
  const SQUIGGLE = "M 15,35 Q 35,5 50,25 T 85,15 Q 95,20 85,35 T 50,25 T 15,35 Z"; 

  function getPath(shape: string) {
      if (shape === 'diamond') return DIAMOND;
      if (shape === 'pill') return PILL;
      return SQUIGGLE;
  }
  
  function getFill(shading: string, color: string) {
      if (shading === 'solid') return color;
      if (shading === 'open') return 'transparent';
      return `url(#${fillId})`;
  }
  
  function handleClick() {
      dispatch('click', { id: card.id });
  }
</script>

<div 
  class="card {selected ? 'selected' : ''}" 
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
>
  <svg viewBox="0 0 100 150" class="card-svg">
    <defs>
      <pattern id={fillId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="2" height="4" fill={color} />
      </pattern>
    </defs>
    
    <g transform="translate(0, {card.count === 1 ? 50 : card.count === 2 ? 25 : 0})">
      {#each Array(card.count) as _, i}
        <g transform="translate(0, {i * 50})">
           <path 
             d={getPath(card.shape)} 
             fill={getFill(card.shading, color)} 
             stroke={color} 
             stroke-width="2" 
             vector-effect="non-scaling-stroke"
           />
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .card {
    width: 100%;
    aspect-ratio: 2/3;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .selected {
    outline: 4px solid #3498db;
    transform: scale(0.95);
    background: #f0f8ff;
  }

  .card-svg {
    width: 100%;
    height: 100%;
  }
</style>
