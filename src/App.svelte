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
  let nextAvailableId = 1; //~ 0 is hardcoded onMount

  type Widget = {
    id: number;
    level: number;
    binsNum: number;
    domain: { start: number; end: number };
    selections: { start: number; end: number; color: string }[];
    widgets: Widget[];
  };

  let widgetTreeRoot: Widget = null;
  $: widgetColumns = processTreeIntoColumns(widgetTreeRoot);
  /*
  widgetColumns = [
    [ {widget}, {widget}, ...],
    [ {widget}, ...],
    [ null, null, {widget}, ...], //~ null here means padding div for layouting purposes
  ]
  */

  //~ 3D data
  const scale = 0.02;
  let spheres = [];
  let topLevelBinsNum = 0;

  function processTreeIntoColumns(root: Widget): Widget[][] {
    console.log("Processing Tree.....");
    if (root == null) {
      return [];
    }

    let columns = [];
    let stack = [root];
    while (stack.length > 0) {
      let currentNode = stack.pop();
      console.log(currentNode);
      const lvl = currentNode.level;
      const paddingSize = currentNode.widgets.length - 1;
      const padding = (paddingSize > 0) ? Array(paddingSize).fill(null) : [];
      if (columns[lvl] === undefined) {
        columns.push([currentNode]);
        // columns.push([currentNode].concat(padding));
      } else {
        // columns[lvl].concat(padding);
        columns[lvl].push(currentNode);
      }

      const widgetsReversed = currentNode.widgets.slice().reverse(); //~ doing reversing because stack does opposite order by nature
      // for (let w of currentNode.widgets) {
      for (let w of widgetsReversed) {
        stack.push(w);
      }
    }

    console.log("columns");
    console.log(columns);
    return columns;
  }

  const newSelection = (ev) => {
    console.log("App: seeing change");
    console.log(ev);
    const sel = ev.detail.selection;
    const sourceWidget = ev.detail.sourceWidget;
    const offset = sourceWidget.domain.start;

    const newWidgetId = nextAvailableId;
    nextAvailableId += 1;

    const changedLevel = sourceWidget.level + 1;
    const newWidget = {
      id: newWidgetId,
      level: sourceWidget.level + 1,
      binsNum: sel.end - sel.start,
      domain: { start: offset + sel.start, end: offset + sel.end },
      selections: [],
      widgets: [],
    };

    // if (widgetHierarchy[changedLevel] === undefined) {
    //   widgetHierarchy.push([newWidget]);
    // } else {
    //   widgetHierarchy[changedLevel].push(newWidget);
    // }
    // widgetHierarchy = widgetHierarchy;

    //~ new
    sourceWidget.widgets.push(newWidget);
    widgetTreeRoot = widgetTreeRoot; //~ because...reactivity
    console.log("current hierarchy:");
    // console.log(widgetHierarchy[0]);
    console.log(widgetTreeRoot);
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

    const rootWidget = {
      id: 0,
      level: 0,
      binsNum: topLevelBinsNum,
      domain: {
        start: 0,
        end: topLevelBinsNum - 1,
      },
      selections: [],
      widgets: [],
    };

    // widgetHierarchy = [
    //   [
    //     {
    //       id: 0,
    //       level: 0,
    //       binsNum: topLevelBinsNum,
    //       domain: {
    //         start: 0,
    //         end: topLevelBinsNum - 1,
    //       },
    //       selections: [],
    //       widgets: [],
    //     },
    //   ],
    // ];
    // widgetTreeRoot = widgetHierarchy[0][0]; //~ kinda weird, TODO: change
    widgetTreeRoot = rootWidget;
  });
</script>

<div id="debug-info-bar" style="width: 100%;">
  <!-- {#each widgetHierarchy as widgets} -->
  {#each widgetColumns as widgets}
    [
    {#each widgets as widget}
      {#if widget == null}
        /null/
      {:else} 
      {widget.id}:
      {#each widget.selections as sel}
        <span style="background-color: {sel.color}">{sel.color}</span>&nbsp;
      {/each}
      {/if}
    {/each}
    ]
  {/each}
</div>

<div id="flex-container" style="display: flex;">
  <!-- {#each widgetHierarchy as widgetsColumn} -->
  {#each widgetColumns as widgetsColumn}
    <div class="widgets-column">
      {#each widgetsColumn as widget}
        {#if widget == null}
          <div style="display: block; width: {hyperWindowSize}px; height: {hyperWindowSize}px; background-color: red">
          </div>
        {:else}
          <HyperWindow
            {widget}
            {hyperWindowSize}
            {selectionWidgetThickness}
            newSelectionCallback={newSelection}
            bins={spheres.slice(widget.domain.start, widget.domain.end + 1)}
          />
        {/if}
      {/each}
    </div>
  {/each}
</div>

<!-- <ForceTest /> -->
<main />

<style>
</style>
