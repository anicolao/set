<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Player } from '../redux/gameSlice';

  export let player: Player | undefined;
  export let position: 'bottom' | 'top' | 'left' | 'right';
  export let isActive: boolean;
  export let isJoined: boolean;
  export let turnExpiresAt: number | null = null;
  
  const dispatch = createEventDispatcher();
  
  const rotation = {
    bottom: 0,
    top: 180,
    left: 90,
    right: -90
  }[position];

  let timeLeft = 10;
  
  import { onMount } from 'svelte';
  
  onMount(() => {
      const interval = setInterval(() => {
          if (isActive && turnExpiresAt) {
              const remaining = Math.max(0, (turnExpiresAt - Date.now()) / 1000);
              timeLeft = remaining;
          } else {
              timeLeft = 10;
          }
      }, 100);
      return () => clearInterval(interval);
  });
  let prevScore = player?.score || 0;
  let scoreFlashing = false;
  
  $: if (player && player.score !== prevScore) {
      if (player.score > prevScore) {
          scoreFlashing = true;
          setTimeout(() => scoreFlashing = false, 1000);
      }
      prevScore = player.score;
  }
</script>

<div class="hud {position}" style="transform: rotate({rotation}deg)">
  {#if !isJoined}
    <button class="btn join" on:click={() => dispatch('join', { position })}>
      Join Game
    </button>
  {:else if player}
     <div class="stats {isActive ? 'active' : ''} {isActive && timeLeft < 3 ? 'urgent' : ''} {scoreFlashing ? 'score-flash' : ''}">
       <div class="name">{player.name}</div>
       <div class="score">Score: {player.score}</div>
       {#if isActive && turnExpiresAt}
          <div class="timer" style="font-size: 0.8rem; text-align: center; color: #7f8c8d;">{timeLeft.toFixed(1)}s</div>
       {/if}
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
  
  .stats.active.urgent {
      animation: pulse-fast 0.3s infinite;
      border-color: #c0392b;
      box-shadow: 0 0 10px #c0392b;
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
  
  @keyframes pulse-fast {
    0% { background: rgba(192, 57, 43, 0.2); transform: scale(1); }
    50% { background: rgba(192, 57, 43, 0.5); transform: scale(1.02); }
    100% { background: rgba(192, 57, 43, 0.2); transform: scale(1); }
  }
  
  .score-flash {
      animation: flash-yellow 1s ease-out;
  }
  
  @keyframes flash-yellow {
      0% { background: rgba(241, 196, 15, 0.0); box-shadow: 0 0 0 rgba(241, 196, 15, 0); }
      20% { background: rgba(241, 196, 15, 0.4); box-shadow: 0 0 20px rgba(241, 196, 15, 0.6); }
      100% { background: rgba(241, 196, 15, 0.0); box-shadow: 0 0 0 rgba(241, 196, 15, 0); }
  }
</style>
