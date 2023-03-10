<script lang="ts">
  import {
    generateColors,
    generateGrayScale,
    generateNicerColors,
    getRandomInt,
    randomNiceColor,
  } from "./lib/util";
  import SelectionWidget from "./lib/components/SelectionWidget.svelte";
  import SampleScene from "./lib/components/SampleScene.svelte";
  import { onMount } from "svelte";
  import { parsePdb } from "./lib/pdb";
  import { brafl } from "./lib/test_BRAFL";
  import ArcSelectionWidget from "./lib/components/ArcSelectionWidget.svelte";

  const hyperWindowSize = 500;
  const selectionWidgetThickness = 25;
  $: colorMap = generateColors(topLevelBinsNum);
  $: grayColorMap = generateGrayScale(topLevelBinsNum);
  $: nicerColorMap = generateNicerColors(topLevelBinsNum);

  //~ 3D data
  const scale = 0.02;
  let spheres = [];
  let widgets = [];
  let topLevelBinsNum = 0;

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
        selectionColor: randomNiceColor(),
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
        selectionColor: randomNiceColor(),
      },
    ];
  });
</script>

<div id="container" style="display: flex;">
  {#each widgets as w, i}
    <div
      class="widget-3d-combo"
      style="display: block; width: 100%; height: 100%, position: relative;"
    >
      <ArcSelectionWidget
        width={hyperWindowSize}
        height={hyperWindowSize}
        widgetThickness={selectionWidgetThickness}
        N={w.binsNum}
        colors={nicerColorMap.slice(w.domain.start, w.domain.end + 1)}
        widgetId={i}
        selectionColor={w.selectionColor}
        on:selectionFinished={newSelection}
        bind:selection={w.selection}
      />
      <SampleScene
        width={hyperWindowSize - 2 * selectionWidgetThickness}
        height={hyperWindowSize - 2 * selectionWidgetThickness}
        offset={selectionWidgetThickness}
        spheres={spheres.slice(w.domain.start, w.domain.end + 1)}
        selection={w.selection}
        selectionColor={w.selectionColor}
      />
    </div>
  {/each}
</div>
<main />

<style>
</style>
