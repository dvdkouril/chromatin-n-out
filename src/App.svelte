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
    import { WebGLMultipleRenderTargets } from "three";

  const hyperWindowSize = 500;
  const selectionWidgetThickness = 25;
  $: colorMap = generateColors(topLevelBinsNum);
  $: grayColorMap = generateGrayScale(topLevelBinsNum);
  $: nicerColorMap = generateNicerColors(topLevelBinsNum);
  let nextAvailableId = 1; //~ 0 is hardcoded onMount

  type Widget = {
    id: number;
    level: number;
    binsNum: number;
    domain: { start: number; end: number};
    selections: { start: number; end: number; color: string}[];
  };

  //~ 3D data
  const scale = 0.02;
  let spheres = [];
  let widgetHierarchy: Widget[][] = [];
  let topLevelBinsNum = 0;

  const newSelection = (ev) => {
    console.log("App: seeing change");
    console.log(ev);
    const sel = ev.detail.selection;
    const sourceWidget = ev.detail.sourceWidget;
    const offset = sourceWidget.domain.start;

    const newWidgetId = nextAvailableId; nextAvailableId += 1;
    

    const changedLevel = sourceWidget.level + 1;
    const newWidget = {
      id: newWidgetId,
      level: sourceWidget.level + 1,
      binsNum: sel.end - sel.start,
      domain: { start: offset + sel.start, end: offset + sel.end },
      selections: [],
    };

    if (widgetHierarchy[changedLevel] === undefined) {
      widgetHierarchy.push([newWidget]);
    } else {
      widgetHierarchy[changedLevel].push(newWidget);
    }
    widgetHierarchy = widgetHierarchy;
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

    widgetHierarchy = [
      [
        {
          id: 0,
          level: 0,
          binsNum: topLevelBinsNum,
          domain: {
            start: 0,
            end: topLevelBinsNum - 1,
          },
          selections: [],
        },
      ],
    ];
  });
</script>

<div id="debug-info-bar" style="width: 100%;">
  {#each widgetHierarchy as widgets}
  [ 
    {#each widgets as widget}
       {widget.id}: 
       {#each widget.selections as sel }
        <span style="background-color: {sel.color}">{sel.color}</span>&nbsp;
        {/each}
    {/each}
  ]
  {/each}
<!-- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec fermentum risus non diam commodo, eget pretium massa condimentum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur consequat ullamcorper diam. Fusce ultricies a purus ac sodales. Praesent laoreet iaculis imperdiet. Proin semper id justo id ultricies. Phasellus pharetra ut nibh id posuere. Praesent efficitur hendrerit porta. Sed in tellus fringilla, pulvinar sem a, rutrum lectus. Vestibulum gravida rhoncus pretium. Aenean odio ligula, laoreet in sodales vitae, pretium nec odio. Pellentesque viverra metus posuere euismod volutpat. -->
</div>

<div id="flex-container" style="display: flex;">
  {#each widgetHierarchy as widgetsColumn}
    <div class="widgets-column">
      {#each widgetsColumn as widget}
        <HyperWindow
          {widget}
          {hyperWindowSize}
          {selectionWidgetThickness}
          newSelectionCallback={newSelection}
          bins={spheres.slice(widget.domain.start, widget.domain.end + 1)}
        />
      {/each}
    </div>
  {/each}
</div>

<!-- DEBUG INFORMATION -->
<!-- <div style="width: 300px;">
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
</div> -->
<!-- <ForceTest /> -->
<main />

<style>
</style>
