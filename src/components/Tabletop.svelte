<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { store } from '../redux/store';
  import { addPlayer, startGame, selectCard, resetGame, dealMore, claimTurn, resolveTurn, expireTurn } from '../redux/gameSlice';
  import GameBoard from './GameBoard.svelte';
  import PlayerHud from './PlayerHud.svelte';
  import GameControls from './GameControls.svelte';
  
  let innerWidth = 0;
  let innerHeight = 0;
  $: isLandscape = innerWidth > innerHeight;
  $: orientation = (isLandscape ? 'landscape' : 'portrait') as 'landscape' | 'portrait';

  let state = store.getState().game; 

  onMount(() => {
    const unsubscribe = store.subscribe(() => {
      state = store.getState().game;
    });
    
    // Timer Interval
    const interval = setInterval(() => {
        if (state.turnExpiresAt && state.activePlayerId) {
            const now = Date.now();
            if (now > state.turnExpiresAt) {
                store.dispatch(expireTurn());
            }
        }
    }, 100);

    return () => {
        unsubscribe();
        clearInterval(interval);
    };
  });

  // Watch for animation result to trigger resolution after delay
  // We use a reactive statement to trigger the timeout ONLY when animatingResult appears
  let animationTimeout: any;
  $: if (state.animatingResult) {
      if (animationTimeout) clearTimeout(animationTimeout);
      animationTimeout = setTimeout(() => {
          store.dispatch(resolveTurn());
      }, 1500); // 1.5s animation duration
  }

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
  
  // Derived state for animations
  $: invalidIds = (state.animatingResult && state.animatingResult.type === 'failure') ? state.animatingResult.cardIds : [];
  $: flyingIds = (state.animatingResult && state.animatingResult.type === 'success') ? state.animatingResult.cardIds : [];
  $: activePlayer = state.players.find(p => p.id === state.animatingResult?.playerId);
  $: flyDirection = activePlayer ? activePlayer.position : null;
  
  // Map positions to control locations/rotations if needed
  // We'll just place them in corners for now as requested "lower right corner... replicate on all edges"
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="tabletop">
  <div class="center">
    {#if state.status === 'lobby'}
      <div class="lobby">
        <h1 style="font-size: 3rem; margin-bottom: 20px; color: #2c3e50;">Set</h1>
        <p style="margin-bottom: 30px; font-size: 1.2rem;">Gather 3 symbols that make a Set.</p>
        <button class="btn-start" on:click={() => store.dispatch(startGame())} disabled={state.players.length < 1}>
          Start Game
        </button>
      </div>
    {:else}
      <GameBoard 
        cards={state.board} 
        selection={state.selection}
        orientation={orientation}
        invalidIds={invalidIds}
        flyingIds={flyingIds}
        flyDirection={flyDirection}
        on:select={handleSelect}
      />
      
      <!-- Controls on edges -->
      <div class="control-wrapper control-bottom">
          <GameControls message={state.message} />
      </div>
      <div class="control-wrapper control-top">
          <GameControls message={state.message} />
      </div>
      <div class="control-wrapper control-left">
          <GameControls message={state.message} />
      </div>
      <div class="control-wrapper control-right">
          <GameControls message={state.message} />
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
       turnExpiresAt={state.turnExpiresAt}
       on:join={handleJoin}
       on:claimSet={(e) => {
           store.dispatch(claimTurn(e.detail.playerId)); 
       }}
     />
  {/each}
</div>

<style>
  .btn-start {
      padding: 15px 40px;
      font-size: 1.5rem;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 0 #219150;
      transition: transform 0.1s, box-shadow 0.1s;
  }
  .btn-start:active {
      transform: translateY(4px);
      box-shadow: 0 0 0 #219150;
  }
  .btn-start:disabled {
      background: #bdc3c7;
      box-shadow: none;
      cursor: not-allowed;
  }

  .tabletop {
      position: relative;
      width: 100vw;
      height: 100vh;
      background-color: #27ae60;
      /* Felt texture: subtle noise + radial vignette */
      background-image: 
          radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E");
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
  }
  
  .lobby {
    text-align: center;
    background: rgba(255,255,255,0.9);
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    pointer-events: auto;
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
      pointer-events: none;
  }
  
  :global(.board) {
      pointer-events: auto;
  }
  
  .control-wrapper {
      position: absolute;
      z-index: 20;
      pointer-events: none;
      
      /* Square wrapper for consistent rotation handling */
      width: 160px;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
  }
  
  /* 
     Positioning:
     Corners relative to player HUDs so they are always "to the right" of the player.
     Consistent corner placement using the square wrapper strategy.
  */

  .control-bottom { 
      bottom: 20px; 
      right: 20px; 
      /* No rotation needed */
  }
  
  .control-top { 
      top: 20px; 
      left: 20px; 
      transform: rotate(180deg);
  }
  
  .control-left { 
      bottom: 20px; 
      left: 20px; 
      transform: rotate(90deg);
  }
  
  .control-right { 
      top: 20px; 
      right: 20px; 
      transform: rotate(-90deg);
  }
</style>
