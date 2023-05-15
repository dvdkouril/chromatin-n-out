<script lang="ts">
  import BubblesPrototype from "./lib/prototypes/BubblesPrototype.svelte";
  import HierarchicalSelectionsPrototype from "./lib/prototypes/HierarchicalSelectionsPrototype.svelte";
  import BigCanvas from "./lib/prototypes/BigCanvas.svelte";

  let prototypes = ["hierarchical-selections", "bubbles", "big-canvas"];
  let currentPrototype = "big-canvas";
</script>

<div id="prototypes-menu">
  <button
    on:click={() => {
      currentPrototype = prototypes[0];
    }}>hierarchical selections</button
  >
  <button
    on:click={() => {
      currentPrototype = prototypes[1];
    }}>bubbles</button
  >
  <button
    on:click={() => {
      currentPrototype = prototypes[2];
    }}>big canvas</button
  >
</div>

{#if currentPrototype == "hierarchical-selections"}
  <HierarchicalSelectionsPrototype />
{:else if currentPrototype == "bubbles"}
  <BubblesPrototype />
{:else if currentPrototype == "big-canvas"}
  <BigCanvas />
{/if}

<style>
</style>
