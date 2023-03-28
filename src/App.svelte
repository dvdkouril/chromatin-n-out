<script lang="ts">
  import {
    generateColors,
    generateGrayScale,
    generateNicerColors,
  } from "./lib/util";
  import { onMount } from "svelte";
  import { parsePdb } from "./lib/pdb";
  import { brafl } from "./lib/test_BRAFL";
  import ColumnsHierarchicalLayout from "./lib/components/ColumnsHierarchicalLayout.svelte";
  import type { Widget } from "./lib/widget";

  const hyperWindowSize = 500;
  const selectionWidgetThickness = 25;
  $: colorMap = generateColors(topLevelBinsNum);
  $: grayColorMap = generateGrayScale(topLevelBinsNum);
  $: nicerColorMap = generateNicerColors(topLevelBinsNum);
  let nextAvailableId = 1; //~ 0 is hardcoded onMount

  let widgetTreeRoot: Widget = null;
  let maxLevel: number = 0;

  //~ 3D data
  const scale = 0.02;
  let spheres = [];
  let topLevelBinsNum = 0;

  const newSelection = (ev) => {
    console.log("App: seeing change");
    console.log(ev);
    const sel = ev.detail.selection;
    const sourceWidget = ev.detail.sourceWidget;
    const offset = sourceWidget.domain.start;

    const newWidgetId = nextAvailableId;
    nextAvailableId += 1;

    const changedLevel = sourceWidget.level + 1;
    if (changedLevel > maxLevel) maxLevel = changedLevel;
    const newWidget = {
      id: newWidgetId,
      level: changedLevel,
      binsNum: sel.end - sel.start,
      domain: { start: offset + sel.start, end: offset + sel.end },
      selections: [],
      widgets: [],
    };

    sourceWidget.widgets.push(newWidget);
    widgetTreeRoot = widgetTreeRoot; //~ because...reactivity
    console.log("current hierarchy:");
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

    widgetTreeRoot = rootWidget;
    maxLevel = 0;
  });
</script>

<ColumnsHierarchicalLayout {widgetTreeRoot} {maxLevel} {hyperWindowSize} {selectionWidgetThickness} newSelectionCallback={newSelection} {spheres} />

<!-- <ForceTest /> -->
<main />

<style>
</style>
