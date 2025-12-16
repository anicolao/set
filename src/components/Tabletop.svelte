<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  import { store } from '../redux/store';
  import { addPlayer, startGame, selectCard, resetGame, dealMore, claimTurn, rematch } from '../redux/gameSlice';
  import GameBoard from './GameBoard.svelte';
  import PlayerHud from './PlayerHud.svelte';
  import GameOverDialog from './GameOverDialog.svelte';
  
  let innerWidth = 0;
  let innerHeight = 0;
  $: isLandscape = innerWidth > innerHeight;
  $: orientation = (isLandscape ? 'landscape' : 'portrait') as 'landscape' | 'portrait';

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

{#if state.status === 'game_over'}
  <GameOverDialog 
     players={state.players} 
     on:rematch={() => store.dispatch(rematch())} 
     on:restart={() => store.dispatch(resetGame())}
  />
{/if}

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
      
      <div class="controls-overlay">
          <div class="message">{state.message || ''}</div>
          
          <button class="control-btn top-right" on:click={() => store.dispatch(resetGame())}>
              Reset Game
          </button>
          
          <button class="control-btn bottom-right" on:click={() => store.dispatch(dealMore())}>
              Deal More
          </button>
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
      /* Reserve space for HUDs so board doesn't overlap */
      padding: 120px 140px; 
      box-sizing: border-box;
  }
  
  /* Absolute Controls */
  .controls-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none; /* Let clicks pass through to board */
  }
  
  .message {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.9);
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: bold;
      pointer-events: auto;
      z-index: 100;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .control-btn {
      position: absolute;
      pointer-events: auto;
      z-index: 20;
      padding: 12px 24px;
      font-size: 1rem;
      border: none;
      border-radius: 8px;
      background: #34495e;
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      transition: transform 0.1s;
  }
  
  .control-btn:hover {
      transform: scale(1.05);
  }
  
  /* Positions - avoid HUDs */
  /* Top Right corner */
  .top-right {
      top: 20px;
      right: 20px;
  }
  
  /* Bottom Right corner */
  .bottom-right {
      bottom: 20px;
      right: 20px;
      background: #e67e22; /* Different color for primary action */
  }
</style>
