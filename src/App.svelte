<script lang="ts">
  import Tabletop from './components/Tabletop.svelte';
  import { setRandomSeed } from './lib/game-logic';
  import { onMount } from 'svelte';

  const urlParams = new URLSearchParams(window.location.search);
  const seed = urlParams.get('seed');
  if (seed) {
      setRandomSeed(seed);
  }
</script>

<Tabletop />

<style>
  /* Global reset handled by vite CSS or browser */
</style>
