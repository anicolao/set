<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from '../redux/store';
  import { addPlayer, startGame, selectCard, resetGame, dealMore, claimTurn } from '../redux/gameSlice';
  import GameBoard from './GameBoard.svelte';
  import PlayerHud from './PlayerHud.svelte';
  
  let state = store.getState().game;

  onMount(() => {
    const unsubscribe = store.subscribe(() => {
      state = store.getState().game;
    });
    return unsubscribe;
  });

  function handleJoin(event: CustomEvent) {
      store.dispatch(addPlayer({ position: event.detail.position }));
  }

  function handleClaimSet(event: CustomEvent) {
       // Code clean up
  }
  
  function handleSelect(event: CustomEvent) {
      if (state.activePlayerId) {
          store.dispatch(selectCard({ playerId: state.activePlayerId, cardId: event.detail.id }));
      } else {
          // Strict Mode: Check active player
          if (!state.activePlayerId) {
             alert("Press your SET button first!");
             return;
          }
          store.dispatch(selectCard({ playerId: state.activePlayerId, cardId: event.detail.id }));
      }
  }
</script>

<div class="tabletop">
  <div class="center">
    {#if state.status === 'lobby'}
      <div class="lobby">
        <h1>Tabletop Set</h1>
        <p>Waiting for players...</p>
        <button on:click={() => store.dispatch(startGame())} disabled={state.players.length < 1}>
          Start Game
        </button>
      </div>
    {:else}
      <GameBoard 
        cards={state.board} 
        selection={state.selection}
        on:select={handleSelect}
      />
      
      <div class="controls">
         <div>Message: {state.message || ''}</div>
         <button on:click={() => store.dispatch(dealMore())}>Deal More</button>
         <button on:click={() => store.dispatch(resetGame())}>Reset</button>
      </div>
    {/if}
  </div>

  <!-- Edges -->
  {#each ['bottom', 'top', 'left', 'right'] as pos}
     <PlayerHud 
       position={pos} 
       player={state.players.find(p => p.position === pos)}
       isJoined={!!state.players.find(p => p.position === pos)}
       isActive={state.activePlayerId === state.players.find(p => p.position === pos)?.id}
       on:join={handleJoin}
       on:claimSet={(e) => {
           store.dispatch(claimTurn(e.detail.playerId)); 
       }}
     />
  {/each}
</div>

<style>
  .tabletop {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: #bdc3c7;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .lobby {
    text-align: center;
  }
</style>
