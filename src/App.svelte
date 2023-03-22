<script lang="ts">
  import {
    generateColors,
    generateGrayScale,
    generateNicerColors,
  } from "./lib/util";
  import { onMount } from "svelte";
  import { parsePdb } from "./lib/pdb";
  import { brafl } from "./lib/test_BRAFL";
  import HyperWindow from "./lib/components/HyperWindow.svelte";

  const hyperWindowSize = 500;
  const selectionWidgetThickness = 25;
  $: colorMap = generateColors(topLevelBinsNum);
  $: grayColorMap = generateGrayScale(topLevelBinsNum);
  $: nicerColorMap = generateNicerColors(topLevelBinsNum);

  //~ 3D data
  const scale = 0.02;
  let spheres = [];
  let widgets = [];
  let widgetHierarchy = [[{}], [{}, {}], [{}, {}, {}]];
  /*
  widgetHierarchy = [[{}], [{}, {}], [{}, {}, {}]]
  */
  let topLevelBinsNum = 0;

  const newSelection = (ev) => {
    console.log("App: seeing change");
    console.log(ev);
    const sel = ev.detail.selection;
    const sourceWidgetId = ev.detail.sourceWidget;
    const sourceWidget = widgets[sourceWidgetId];
    const offset = sourceWidget.domain.start;

    //~ spawns new widget
    widgets = [
      ...widgets,
      {
        id: sourceWidgetId + 1,
        binsNum: sel.end - sel.start,
        domain: { start: offset + sel.start, end: offset + sel.end },
        selections: [],
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
        id: 0,
        binsNum: topLevelBinsNum,
        domain: {
          start: 0,
          end: topLevelBinsNum - 1,
        },
        selections: [],
      },
    ];
  });
</script>

<div id="container" style="display: flex;">
  {#each widgets as w, i}
    <HyperWindow
      widget={w}
      {hyperWindowSize}
      {selectionWidgetThickness}
      newSelectionCallback={newSelection}
      bins={spheres.slice(w.domain.start, w.domain.end + 1)}
    />
  {/each}
</div>

<!-- columns test -->
<!-- <div id="flex-container" style="display: flex;">
  {#each widgetHierarchy as widgetsColumn}
    <div class="widgets-column">
      {#each widgetsColumn as widget}
        <HyperWindow />
      {/each}
    </div>
  {/each}
</div> -->

<!-- DEBUG INFORMATION -->
<div style="width: 300px;">
  <h3>debug</h3>
  <ul>
    {#each widgets as widget}
      <li>
        {widget.binsNum}
        <ul>
          {#each widget.selections as sel}
            <li>
              {"[" + sel.start.toString() + " - " + sel.end.toString() + "]"}
              <span style="background-color: {sel.color}">{sel.color}</span>
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
</div>
<!-- <ForceTest /> -->
<main />

<style>
</style>
