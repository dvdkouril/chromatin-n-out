<script lang="ts">
  import BubblesPrototype from "./lib/components/BubblesPrototype.svelte";
  import HierarchicalSelectionsPrototype from "./lib/prototypes/HierarchicalSelectionsPrototype.svelte";

  let prototypes = ["hierarchical-selections", "bubbles"];
  let currentPrototype = "hierarchical-selections";
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
</div>

{#if currentPrototype == "hierarchical-selections"}
  <HierarchicalSelectionsPrototype />
{:else if currentPrototype == "bubbles"}
  <BubblesPrototype />
{/if}

<style>
</style>
