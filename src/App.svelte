<script lang="ts">
  import { generateColors } from "./lib/util";
  import SelectionWidget from "./lib/components/SelectionWidget.svelte";
  import SampleScene from "./lib/components/SampleScene.svelte";
  import { onMount } from "svelte";
  import { parsePdb } from "./lib/pdb";
  import { brafl } from "./lib/test_BRAFL";
  import ArcSelectionWidget from "./lib/components/ArcSelectionWidget.svelte";

  const width = 600;
  const height = 50;
  let topLevelBinsNum = 500;
  $: colorMap = generateColors(topLevelBinsNum);

  //~ 3D data
  const scale = 0.02;

  let spheres = [{ x: 0, y: 0, z: 0 }];

  let widgets = [];

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
        domain: { start: offset + sel.start, end: offset + sel.end },
        selection: null,
      },
    ];
  };

  onMount(() => {
    console.log("onMount");

    //~ load the PDB
    spheres = parsePdb(brafl).bins.map(({ x, y, z }) => ({
      x: x * scale,
      y: y * scale,
      z: z * scale,
    }));
    topLevelBinsNum = spheres.length;
    console.log("num of spheres = " + topLevelBinsNum);

    widgets = [
      {
        binsNum: topLevelBinsNum,
        domain: {
          start: 0,
          end: topLevelBinsNum - 1,
        },
        selection: null,
      },
    ];
  });
</script>

<div id="container" style="display: flex;">
  {#each widgets as w, i}
    <div class="widget-3d-combo" style="display: block; width: 100%; height: 100%, position: relative;">
      <!-- <SelectionWidget
        {width}
        {height}
        N={w.binsNum}
        colors={colorMap.slice(w.domain.start, w.domain.end)}
        widgetId={i}
        on:selectionFinished={newSelection}
        bind:selection={w.selection}
      /> -->
      
      <ArcSelectionWidget
        width={600}
        height={400}
        N={w.binsNum}
        colors={colorMap.slice(w.domain.start, w.domain.end)}
        widgetId={i}
        on:selectionFinished={newSelection}
        bind:selection={w.selection}
      />
      <SampleScene
        spheres={spheres.slice(w.domain.start, w.domain.end)}
        selection={w.selection}
      />
    </div>
  {/each}
</div>
<main />

<style>
</style>
