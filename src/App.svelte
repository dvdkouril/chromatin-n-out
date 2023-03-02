<script lang="ts">
  import SelectionWidget from "./lib/SelectionWidget.svelte";

  const width = 600;
  const height = 200;

  let widgets = [{ binsNum: 100 }, { binsNum: 50 }, { binsNum: 10 }];
  //~ TODO:
  // - callback from SelectionWidget for adding a new widget (or changing the selection)
</script>

<div id="container">
  {#each widgets as w}
    <SelectionWidget {width} {height} N={w.binsNum} />
  {/each}
</div>
<main />

<style>
</style>
