<script lang="ts">
    import {
      generateColors,
      generateGrayScale,
      generateNicerColors,
    } from "../../util";
    import { onMount } from "svelte";
    import { parsePdb } from "../../pdb";
    import { brafl } from "../../test_BRAFL";
    import { cell7 } from "../../test_cell7";
    import ColumnsHierarchicalLayout from "./components/ColumnsHierarchicalLayout.svelte";
    import type { Widget } from "../../hyperwindows-types";
  
    const hyperWindowSize = 250;
    const selectionWidgetThickness = 25;
    // $: colorMap = generateColors(topLevelBinsNum);
    // $: grayColorMap = generateGrayScale(topLevelBinsNum);
    // $: nicerColorMap = generateNicerColors(topLevelBinsNum);
    $: selectionsColormap = generateNicerColors(topLevelBinsNum);
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
        colorForSelections: sel.color,
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
      // spheres = parsePdb(cell7).bins.map(({ x, y, z }) => ({
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
        colorForSelections: null,
        widgets: [],
      };
  
      widgetTreeRoot = rootWidget;
      maxLevel = 0;
      console.log("onMount finished");
    });
  </script>
  
  <ColumnsHierarchicalLayout {widgetTreeRoot} {maxLevel} {hyperWindowSize} {selectionWidgetThickness} newSelectionCallback={newSelection} {selectionsColormap} {spheres} />
  
  <main />
  
  <style>
  </style>
  