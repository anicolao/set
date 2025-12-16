import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { setSeed } from './lib/game-logic'

const params = new URLSearchParams(window.location.search);
const seed = params.get('seed');
if (seed) {
  setSeed(seed);
}





const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
