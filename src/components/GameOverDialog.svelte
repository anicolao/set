<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Player } from '../redux/gameSlice';

  export let players: Player[] = [];
  export let winnerId: string | null = null;

  const dispatch = createEventDispatcher();

  $: sortedPlayers = [...players].sort((a, b) => b.score - a.score);
</script>

<div class="overlay">
  <div class="dialog">
    <h1>Game Over!</h1>
    
    <div class="scores">
      {#each sortedPlayers as player (player.id)}
        <div class="player-row" class:winner={player.id === winnerId}>
          <span class="rank">
             {#if player.id === winnerId}🏆{/if}
          </span>
          <span class="name">{player.name}</span>
          <span class="score">{player.score}</span>
        </div>
      {/each}
    </div>

    <div class="actions">
      <button class="primary" on:pointerdown|preventDefault={() => dispatch('rematch')}>Rematch</button>
      <button class="secondary" on:pointerdown|preventDefault={() => dispatch('lobby')}>Back to Lobby</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .dialog {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    min-width: 300px;
    text-align: center;
    font-family: 'Inter', sans-serif;
  }

  h1 {
    margin-top: 0;
    color: #333;
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  .scores {
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .player-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #f5f5f5;
    border-radius: 0.5rem;
    font-size: 1.1rem;
  }

  .player-row.winner {
    background: #fff8e1;
    border: 2px solid #ffca28;
    font-weight: bold;
  }

  .rank {
    width: 24px;
    font-size: 1.2rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.1s;
  }

  button:active {
    transform: scale(0.95);
  }

  .primary {
    background: #4caf50;
    color: white;
  }

  .secondary {
    background: #e0e0e0;
    color: #333;
  }
</style>
