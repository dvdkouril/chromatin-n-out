<script lang="ts">
  import { generateColors } from "./lib/util";
  import SelectionWidget from "./lib/components/SelectionWidget.svelte";
  import SampleScene from "./lib/components/SampleScene.svelte";

  const width = 600;
  const height = 200;
  const topLevelBinsNum = 500;
  $: colorMap = generateColors(topLevelBinsNum);

  let widgets = [
    {
      binsNum: topLevelBinsNum,
      domain: {
        start: 0,
        end: topLevelBinsNum - 1,
      },
      selection: null,
    },
  ];
  
  const newSelection = (ev) => {
    console.log("App: seeing change");
    console.log(ev);
    const sel = ev.detail.selection;
    const sourceWidgetId = ev.detail.sourceWidget;
    const sourceWidget = widgets[sourceWidgetId]; 
    const offset = sourceWidget.domain.start;

  widgets = [
    ...widgets.slice(0, sourceWidgetId + 1),
    {
      binsNum: sel.end - sel.start,
      domain: { start: offset + sel.start, end: offset + sel.end},
      selection: null,
    }
  ]

  }
</script>

<div id="container">
  {#each widgets as w, i}
    <SelectionWidget
      {width}
      {height}
      N={w.binsNum}
      colors={colorMap.slice(w.domain.start, w.domain.end)}
      widgetId={i}
      on:selectionFinished={newSelection}
      bind:selection={w.selection}
    />
  {/each}
</div>
<SampleScene />
<main />

<style>
</style>
