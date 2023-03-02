<script lang="ts">
  import SelectionWidget from "./lib/SelectionWidget.svelte";

  const width = 600;
  const height = 200;

  // let widgets = [{ binsNum: 100 }, { binsNum: 50 }, { binsNum: 10 }];
  let widgets = [{ binsNum: 100 }];
  //~ TODO:
  // - callback from SelectionWidget for adding a new widget (or changing the selection)

  const updateWidgets = (ev) => {
    //~ selection changed in some widget => update state here
    console.log("Widgets need updating!");
  }

  const newSelection = (ev) => {
    console.log("App: seeing change");
    console.log(ev);
    widgets = [
      ...widgets,
      // { binsNum: ev.binNum },
      // { binsNum: ev.end - ev.start },
      // { binsNum: 10 },
      { binsNum: ev.detail.selection.end - ev.detail.selection.start },
    ]
  }
</script>

<div id="container">
  {#each widgets as w}
    <!-- <SelectionWidget {width} {height} N={w.binsNum} on:selectionFinished={updateWidgets} /> -->
    <SelectionWidget {width} {height} N={w.binsNum} on:selectionFinished={newSelection} />
  {/each}
</div>
<main />

<style>
</style>
