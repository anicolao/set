<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card } from '../lib/game-logic';
  
  export let card: Card;
  export let selected: boolean = false;
  export let orientation: 'landscape' | 'portrait' = 'portrait';
  
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
  const SQUIGGLE = "M 15,20 C 35,0 65,50 85,20 Q 95,25 85,30 C 65,50 35,0 15,30 Q 5,25 15,20 Z"; 

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

  // Landscape Transform: Rotate content 90deg? 
  // No, if the card container is landscape, we should just lay out the shapes horizontally.
  // Portrait: 100w x 150h. Shapes at 50, 25, 0 vertical offset.
  // Landscape: 150w x 100h. Shapes at ?, ?, ? horizontal offset.
  // Let's redefine viewbox and transform based on orientation.
  
  $: isLandscape = orientation === 'landscape';
  $: viewBox = isLandscape ? "0 0 150 100" : "0 0 100 150";
  
  // Center shapes in the card
  // Shape box is 100x50.
  // Portrait (100x150): Stack 3 (max).
  // 1 shape: Center at y=50.
  // 2 shapes: y=25, y=75.
  // 3 shapes: y=0, y=50, y=100.
  
  // Landscape (150x100): Stack 3 horizontally.
  // 1 shape: Center at x=75-50=25? No, shape width is 100.
  // Wait, shapes are 100 wide, 50 high.
  // Fitting 3 shapes horizontally (300 width) into 150 width? No.
  // We need to ROTATE the shapes themselves 90deg effectively?
  // User said "rotate the cards 90 degrees".
  // This usually implies the symbols run lengthwise.
  // Standard Set card: 2:3 ratio. Symbols stacked.
  // Rotated card: 3:2 ratio. Symbols side-by-side?
  // OR symbols are still "upright" relative to the card's long axis?
  // If I hold a playing card sideways, the text/pips are sideways.
  // So effectively: rotate the whole SVG or coordinate system by 90deg.
  
  // Let's effectively rotate the coordinate system.
  // Portrait: 0 0 100 150.
  // Landscape: same content, but rotated 90deg?
  // Translate center, rotate 90.
  // Center of portrait is 50, 75.
  // Center of landscape is 75, 50.
  
  // Let's try: render distinct layout for readability.
  // If landscape, we want shape to be width 50, height 100? (Rotated shape).
  // Yes, rotate the shape 90deg.
  
  // Implementing rotation via SVG transform group.
</script>

<div 
  class="card {orientation} {selected ? 'selected' : ''}" 
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
>
  <svg {viewBox} class="card-svg">
    <defs>
      <pattern id={fillId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="2" height="4" fill={color} />
      </pattern>
    </defs>
    
    <g class="content-group {orientation}">
        {#if !isLandscape}
            <!-- PORTRAIT: Stack Vertically -->
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
        {:else}
            <!-- LANDSCAPE: Rotate 90deg and Stack Horizontally? 
                 Actually, simpler to just rotate the whole group around center.
                 Center of 100x150 is 50,75.
                 Rotate -90? -> Width becomes Height.
            -->
            <g transform="translate(75, 50) rotate(-90) translate(-50, -75)">
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
            </g>
        {/if}
    </g>
  </svg>
</div>

<style>
  .card {
    width: 100%;
    height: 100%; /* Fill the grid cell */
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
    
    /* Let grid control aspect ratio */
  }
  
  /* .card.portrait { aspect-ratio: 2/3; } - REMOVED */
  /* .card.landscape { aspect-ratio: 3/2; } - REMOVED */
  
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
