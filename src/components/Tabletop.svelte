<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { store } from '../redux/store';
  import { addPlayer, startGame, selectCard, resetGame, dealMore, claimTurn } from '../redux/gameSlice';
  import GameBoard from './GameBoard.svelte';
  import PlayerHud from './PlayerHud.svelte';
  
  let innerWidth = 0;
  let innerHeight = 0;
  $: isLandscape = innerWidth > innerHeight;
  $: orientation = isLandscape ? 'landscape' : 'portrait';

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
  
  const dispatch = createEventDispatcher();
  
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

  const POSITIONS = ['bottom', 'top', 'left', 'right'] as const;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

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
        orientation={orientation}
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
  {#each POSITIONS as pos}
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

  .center {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10;
      position: relative;
  }
  
  /* .center > * removed as not needed */
</style>
