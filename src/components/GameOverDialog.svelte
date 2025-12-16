<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Player } from '../redux/gameSlice';

  export let players: Player[] = [];
  
  const dispatch = createEventDispatcher();

  $: sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  $: winner = sortedPlayers[0];
  $: others = sortedPlayers.slice(1);
  $: isTie = others.length > 0 && others[0].score === winner.score;
</script>

<div class="overlay">
  <div class="dialog">
    <h1>Game Over!</h1>
    
    <div class="winner">
      {#if isTie}
         <h2>It's a Tie!</h2>
         <div class="score">{winner.score} pts</div>
         <p>{winner.name} and {others[0].name}</p>
      {:else}
         <h2>Winner: {winner.name}</h2>
         <div class="score">{winner.score} pts</div>
      {/if}
    </div>

    {#if others.length > 0 && !isTie}
      <div class="standings">
        <h3>Standings</h3>
        <ul>
          {#each others as p}
            <li>
              <span>{p.name}</span>
              <span>{p.score} pts</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="actions">
      <button class="primary" on:click={() => dispatch('rematch')}>Rematch</button>
      <button class="secondary" on:click={() => dispatch('restart')}>Main Menu</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .dialog {
    background: white;
    padding: 30px 40px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    min-width: 300px;
  }

  h1 { margin: 0 0 20px; color: #2c3e50; }
  h2 { margin: 10px 0; color: #27ae60; }
  
  .score {
    font-size: 3rem;
    font-weight: bold;
    color: #34495e;
    margin: 10px 0 20px;
  }

  .standings {
    margin: 20px 0;
    text-align: left;
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
  }
  
  ul { list-style: none; padding: 0; margin: 0; }
  li { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
  li:last-child { border-bottom: none; }

  .actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 25px;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.1s;
  }
  
  button:hover { transform: translateY(-2px); }

  .primary { background: #3498db; color: white; }
  .secondary { background: #95a5a6; color: white; }
</style>
