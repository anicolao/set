<script lang="ts">
  import { store } from '../redux/store';
  import { dealMore, resetGame } from '../redux/gameSlice';

  export let message: string | null = null;
  export let orientation: 'landscape' | 'portrait' = 'landscape';
  
  // We might want to rotate the controls based on position on the table.
  export let rotation: number = 0;
</script>

<div class="controls" style="transform: rotate({rotation}deg)">
    <div class="message">{message || ''}</div>
    <div class="buttons">
        <button class="btn" on:click={() => store.dispatch(dealMore())}>Deal 3</button>
        <button class="btn reset" on:click={() => store.dispatch(resetGame())}>Reset</button>
    </div>
    <button class="btn exit" on:click={() => window.close()}>Exit</button>
</div>

<style>
  .controls {
    background: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: auto;
    width: 160px;
  }
  
  .message {
      font-size: 0.9rem;
      font-weight: bold;
      color: #333;
      text-align: center;
      min-height: 1.2em;
  }
  
  .buttons {
      display: flex;
      gap: 10px;
  }

  .btn {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #eee;
      cursor: pointer;
      font-size: 0.9rem;
  }
  
  .btn:hover {
      background: #ddd;
  }
  
  .reset {
      color: #c0392b;
  }

  .exit {
      background: #95a5a6;
      color: white;
      width: 100%;
  }
  
  .exit:hover {
      background: #7f8c8d;
  }
</style>
