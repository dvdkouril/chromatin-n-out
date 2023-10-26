<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "./components/Scene.svelte";
    import type { Vector2 } from "three";
    import DebugOverlay from "./components/DebugOverlay.svelte";
    import SelectionsLayer from "./components/SelectionsLayer.svelte";
    import type { Widget } from "../../widget";
    import { onMount } from "svelte";
    import { parsePdb } from "../../pdb";
    import { brafl } from "../../test_BRAFL";

    let boundingSpheres: { center: Vector2; radius: number }[] = [];
    let debugPositions: Vector2[] = [];

    const hyperWindowSize = 250;
    const selectionWidgetThickness = 25;

    let canvasWidth; //~ binding these upwards with useThrelte
    let canvasHeight;

    // let widgets: Widget[] = [];
    $: widgets = processTreeIntoArray(widgetTreeRoot);
    let nextAvailableId = 1; //~ 0 is hardcoded onMount
    let widgetTreeRoot: Widget = null;
    let maxLevel: number = 0;

    //~ 3D data
    const scale = 0.02;
    let spheres = [];
    let topLevelBinsNum = 0;

    const processTreeIntoArray = (root: Widget): Widget[] => {
        if (root == null) {
            return [];
        }

        let arr = [];
        let stack: [Widget, number][] = [[root, 0]];
        while (stack.length > 0) {
            let [currentNode, layer] = stack.pop();
            const lvl = currentNode.level;

            arr.push(currentNode);

            const widgetsReversed = currentNode.widgets.slice().reverse(); //~ doing reversing because stack does opposite order by nature
            let childNumber = widgetsReversed.length - 1;
            for (let w of widgetsReversed) {
                stack.push([w, layer + childNumber]);
                childNumber -= 1;
            }
        }

        return arr;
    };

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

<div id="canvas-container">
    <!-- Canvas containing 3D models -->
    <Canvas>
        <Scene
            bind:canvasWidth
            bind:canvasHeight
            bind:boundingSpheres
            bind:debugPositions
        />
    </Canvas>

    <!-- SVG debug overlay -->
    <DebugOverlay
        {canvasWidth}
        {canvasHeight}
        {boundingSpheres}
        {debugPositions}
    />

    <!-- SVG-based layer with selection widgets for each 3D (sub)model -->
    <SelectionsLayer
        width={100}
        height={100}
        selectionWidgets={widgets}
        {hyperWindowSize}
        {selectionWidgetThickness}
        newSelectionCallback={newSelection}
    />
    <!-- <SelectionsLayer
        selectionWidgets={widgets}
        {hyperWindowSize}
        {selectionWidgetThickness}
        newSelectionCallback={newSelection}
        colorForSelection={widget.colorForSelections}
        bins={spheres.slice(widget.domain.start, widget.domain.end + 1)}
    /> -->
</div>

<style>
    #canvas-container {
        overflow: hidden;
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>
