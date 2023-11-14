<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "./components/Scene.svelte";
    import { PerspectiveCamera, Vector2, Vector3 } from "three";
    import DebugOverlay from "./components/DebugOverlay.svelte";
    import SelectionsLayer from "./components/SelectionsLayer.svelte";
    import { onMount } from "svelte";
    import { brafl } from "../../test_BRAFL";
    import {
        getRandomInt,
        load3DModel,
        unprojectToWorldSpace,
    } from "../../util";
    import type {
        HWGeometry,
        HWSelectionWidget,
        HyperWindow,
        HW3DView,
        BoundingSphere,
    } from "../../hyperwindows-types";

    const selectionWidgetThickness = 25;

    let canvasWidth = 800; //~ binding these upwards with useThrelte
    let canvasHeight = 600;
    let matterjsDebugCanvas = undefined;
    let camera: PerspectiveCamera;

    let scene;

    let nextAvailableId = 1; //~ 0 is hardcoded onMount

    //~ Main data structures
    // let rootHyperWindows: HyperWindow[] = []; //~ contains roots of HyperWindow hierarchies
    let hyperWindows: HyperWindow[] = [];
    let hwModels: HWGeometry[] = []; //~ top level (whole) 3D models which are subdivided for individual HyperWindows
    let hw3DViews: HW3DView[] = []; //~ linearized array with information only relevant for the 3D rendering
    let hwWidgets: HWSelectionWidget[] = []; //~ linearized array with information only relevant for the selection widget

    //~ Structures related to computation of the bounding sphere and final screen positions
    let boundingSpheres: BoundingSphere[] = []; //~ bound to Scene, returns bounding spheres
    $: widgetsAndPositionsAndRadii = updateWidgetsScreenPositions(
        hwWidgets,
        boundingSpheres
    ); //~ for SelectionsLayer

    //~ DEBUG
    let debugPositions: [Vector2, string][] = []; //~ for now used for screen space positions of model spheres
    let showMatterDebug: boolean = true;
    let showBoundingSphereDebug: boolean = true;
    let debugTexts: { text: string; x: number; y: number }[] = [];

    const updateWidgetsScreenPositions = (
        widgets: HWSelectionWidget[],
        bSpheres: BoundingSphere[]
    ): [HWSelectionWidget, Vector2, number][] => {
        if (widgets.length != bSpheres.length) {
            console.log(
                "error: widgets and bSpheres should have the same number of elements."
            );
            console.log("widgets: " + widgets.length);
            console.log("bSpheres: " + bSpheres.length);
            return [];
        }

        // console.log("we good...recomputing position of widget!");
        let res: [HWSelectionWidget, Vector2, number][] = [];
        for (let [i, w] of widgets.entries()) {
            res.push([w, bSpheres[i].center, bSpheres[i].radius]);
        }
        return res;
    };

    const processHyperWindowsHierarchy = () => {
        //~ TODO: based on the above processWidgetsHierarchy, I might want to generate the arrays from the tree
        //~ for now I can just update the arrays directly though
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
        // if (changedLevel > maxLevel) maxLevel = changedLevel;
        const newWidget: HWSelectionWidget = {
            id: newWidgetId,
            level: changedLevel,
            binsNum: sel.end - sel.start,
            domain: { start: offset + sel.start, end: offset + sel.end },
            selections: [],
            colorForSelections: sel.color,
            // widgets: [],
        };

        const randomPositionAroundHyperWindow = (
            sourceWidgetPosition: Vector2,
            sourceWidgetRadius: number
        ): Vector2 => {
            const rndAngle = getRandomInt(360);
            const unitVec = new Vector2(1, 0);
            unitVec.rotateAround(
                new Vector2(0, 0),
                (rndAngle * Math.PI) / 180.0
            );
            unitVec.normalize();
            unitVec.multiplyScalar(sourceWidgetRadius * 2.0); //~ x2.0 is overestimation probably

            const newPosition = sourceWidgetPosition.add(unitVec);
            return newPosition;
        };

        const startScreenPosition = randomPositionAroundHyperWindow(
            new Vector2(0.5, 0.5),
            100 / canvasWidth
        );

        const initialRadius = 100;
        const new3DView = default3DView();
        const modelSubset = {
            ...hwModels[0], //~ TODO: still hacky..I should get the model from the source HW
            spheres: hwModels[0].spheres.slice(
                newWidget.domain.start,
                newWidget.domain.end + 1
            ),
            tubes: hwModels[0].tubes.slice(
                newWidget.domain.start,
                newWidget.domain.end + 1
            ), //~ TODO: there's probably a off-by-one error
        };
        const newHW: HyperWindow = {
            screenPosition: startScreenPosition,
            currentRadius: initialRadius,
            associatedBodyId: 0,
            associatedBodyIndex: 0, //~ one of these is redundant but i can't say which rn
            model: modelSubset, //~ TODO: this needs to be figured out...this is hacky as hell
            widget: newWidget,
            threeDView: new3DView,
            childHyperWindows: [],
        };

        hyperWindows = [...hyperWindows, newHW];
        hwModels = [...hwModels, hwModels[0]]; //~ top level (whole) 3D models which are subdivided for individual HyperWindows
        hw3DViews = [...hw3DViews, new3DView]; //~ linearized array with information only relevant for the 3D rendering
        hwWidgets = [...hwWidgets, newWidget];

        scene.newHyperWindowAdded(newHW);
    };
    const default3DView = (): HW3DView => {
        return {
            rotationX: 0,
            rotationY: 0,
            zoom: 1,
        };
    };

    const makeNewHyperWindow = (): [
        HyperWindow,
        HWGeometry,
        HW3DView,
        HWSelectionWidget
    ] => {
        //~ 1. load the 3D model (future TODO: multiple models)
        const rootModel = load3DModel(brafl, 0.02);

        //~ 2. create selection widget
        const rootWidget: HWSelectionWidget = {
            id: 0,
            level: 0,
            binsNum: rootModel.spheres.length,
            domain: {
                start: 0,
                end: rootModel.spheres.length - 1,
            },
            selections: [],
            colorForSelections: null,
        };

        //~ 3. create 3D view part of HyperWindow
        const root3DView: HW3DView = default3DView();

        //~ 4. create HyperWindow
        const startScreenPosition = new Vector2(0.5, 0.5); //~ middle of the screen
        // const startScreenPosition = new Vector2(0.25, 0.5);

        const initialRadius = 100;
        const rootHW: HyperWindow = {
            screenPosition: startScreenPosition,
            currentRadius: initialRadius,
            associatedBodyId: 0, //~ these get filled out in Scene
            associatedBodyIndex: 0, //~ one of these is redundant but i can't say which rn
            model: rootModel,
            widget: rootWidget,
            threeDView: root3DView,
            childHyperWindows: [],
        };

        return [rootHW, rootModel, root3DView, rootWidget];
    };

    const initWithSingle = () => {
        const [hwRoot, hwRootModel, hwRoot3DView, hwRootWidget] =
            makeNewHyperWindow();

        hyperWindows = [hwRoot];
        hwModels = [hwRootModel];
        hw3DViews = [hwRoot3DView];
        hwWidgets = [hwRootWidget];
    };

    onMount(() => {
        initWithSingle();
    });
</script>

<div id="debug-bar">
    <button on:click={() => (showMatterDebug = !showMatterDebug)}
        >{showMatterDebug ? "~on~" : "-off-"}</button
    >
    <button
        on:click={() => (showBoundingSphereDebug = !showBoundingSphereDebug)}
        >{showBoundingSphereDebug ? "~on~" : "-off-"}</button
    >
</div>
<div id="canvas-container">
    <!-- Canvas containing 3D models -->
    <Canvas>
        <Scene
            bind:this={scene}
            bind:hyperWindows
            bind:canvasWidth
            bind:canvasHeight
            bind:boundingSpheres
            bind:debugPositions
            bind:debugTexts
            bind:camera
            {showMatterDebug}
            {matterjsDebugCanvas}
        />
    </Canvas>

    <!-- SVG debug overlay -->
    {#if showBoundingSphereDebug}
        <DebugOverlay
            {canvasWidth}
            {canvasHeight}
            {boundingSpheres}
            {debugPositions}
            {debugTexts}
        />
    {/if}

    <!-- SVG-based layer with selection widgets for each 3D (sub)model -->
    <SelectionsLayer
        width={canvasWidth}
        height={canvasHeight}
        {widgetsAndPositionsAndRadii}
        {selectionWidgetThickness}
        newSelectionCallback={newSelection}
    />

    <!-- placeholder for Matter.js debug view -->
    <canvas
        id="matterjs-debug"
        width={canvasWidth}
        height={canvasHeight}
        bind:this={matterjsDebugCanvas}
    />
</div>

<style>
    #canvas-container {
        overflow: hidden;
        position: relative;
        width: 100%;
        height: 100%;
    }

    #matterjs-debug {
        position: absolute;
        top: 0;
        left: 0;
        opacity: 50%;
        pointer-events: none;
    }
</style>
