<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Player } from '../redux/gameSlice';

  export let player: Player | undefined;
  export let position: 'bottom' | 'top' | 'left' | 'right';
  export let isActive: boolean;
  export let isJoined: boolean;
  
  const dispatch = createEventDispatcher();
  
  const rotation = {
    bottom: 0,
    top: 180,
    left: 90,
    right: -90
  }[position];
</script>

<div class="hud {position}" style="transform: rotate({rotation}deg)">
  {#if !isJoined}
    <button class="btn join" on:click={() => dispatch('join', { position })}>
      Join Game
    </button>
  {:else if player}
     <div class="stats {isActive ? 'active' : ''}">
       <div class="name">{player.name}</div>
       <div class="score">Score: {player.score}</div>
       <button 
         class="btn set" 
         disabled={isActive}
         on:click={() => dispatch('claimSet', { playerId: player.id })}
       >
         SET!
       </button>
     </div>
  {/if}
</div>

<style>
  .hud {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 10;
    pointer-events: none; /* Container doesn't block; background might if opaque, but allows careful clicking */
  }

  /* Re-enable for interactive children */
  .btn, .name, .score {
      pointer-events: auto;
  }
  
  .bottom { bottom: 20px; left: 50%; transform-origin: center; margin-left: -100px; width: 200px; }
  .top { top: 20px; left: 50%; transform-origin: center; margin-left: -100px; width: 200px; }
  .left { left: 20px; top: 50%; transform-origin: center; margin-top: -100px; width: 200px; }
  .right { right: 20px; top: 50%; transform-origin: center; margin-top: -100px; width: 200px; }

  .stats.active {
      border: 2px solid #e74c3c;
      animation: pulse 1s infinite;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .join { background: #3498db; color: white; }
  .set { background: #e74c3c; color: white; width: 100%; margin-top: 5px; }
  .set:disabled { background: #ccc; cursor: not-allowed; }

  @keyframes pulse {
    0% { background: rgba(231, 76, 60, 0.1); }
    50% { background: rgba(231, 76, 60, 0.3); }
    100% { background: rgba(231, 76, 60, 0.1); }
  }
</style>
