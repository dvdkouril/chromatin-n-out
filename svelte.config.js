import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import preprocess from 'svelte-preprocess'
import seqPreprocessor from 'svelte-sequential-preprocessor'
import { preprocessThrelte } from '@threlte/preprocess'

const config = {
// export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  // preprocess: vitePreprocess(),
  // preprocess: seqPreprocessor([preprocess(), preprocessThrelte]),
  preprocess: seqPreprocessor([vitePreprocess(), preprocess(), preprocessThrelte()]),
}

export default config