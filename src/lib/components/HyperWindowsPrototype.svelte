<script lang="ts">
    import { Canvas } from "@threlte/core";
    // import Scene from "./HyperWindows/Scene.svelte";
    import type Scene from "./HyperWindows/Scene.svelte";
    import { PerspectiveCamera, Vector2 } from "three";
    import DebugOverlay from "./HyperWindows/DebugOverlay.svelte";
    import SelectionsLayer from "./HyperWindows/SelectionsLayer.svelte";
    import { onMount } from "svelte";
    import { brafl } from "../test_BRAFL";
    import { spomb } from "../test_SPOMB";
    import { computeTubes, load3DModel, randomPositionAroundHyperWindow, recenter } from "../util";
    import {
        type HWGeometry,
        type HWSelectionWidget,
        type HyperWindow,
        type HW3DView,
        type BoundingSphere,
        type Selection,
        WidgetStyle,
    } from "../hyperwindows-types";
    import { cell7 } from "$lib/test_cell7";
    import DebugBar from "./HyperWindows/DebugBar.svelte";
    import LayoutOptimizer from "./HyperWindows/LayoutOptimizer.svelte";

    const selectionWidgetThickness = 25;

    let canvasWidth = 800; //~ binding these upwards with useThrelte
    let canvasHeight = 600;
    let matterjsDebugCanvas: HTMLCanvasElement | undefined = undefined;
    let camera: PerspectiveCamera;

    let scene: Scene;

    let nextAvailableId = 1; //~ 0 is hardcoded onMount

    //~ example dataset selection
    const exampleDatasets = [
        { id: 1, name: "brafl" },
        { id: 2, name: "cell7" },
        { id: 3, name: "spomb" },
    ];
    let selectedDataset: { id: number; name: string } = exampleDatasets[2];

    //~ Main data structures
    let hyperWindows: HyperWindow[] = [];
    let hwModels: HWGeometry[] = []; //~ top level (whole) 3D models which are subdivided for individual HyperWindows
    let hw3DViews: HW3DView[] = []; //~ linearized array with information only relevant for the 3D rendering
    let hwWidgets: HWSelectionWidget[] = []; //~ linearized array with information only relevant for the selection widget

    /*
    The main array to hold current positions of all HyperWindows
    */
    let hyperWindowsPositions: Vector2[] = [];

    //~ Structures related to computation of the bounding sphere and final screen positions
    let boundingSpheres: BoundingSphere[] = []; //~ bound to Scene, returns bounding spheres
    // $: widgetsAndPositionsAndRadii = updateWidgetsScreenPositions(hwWidgets, boundingSpheres); //~ for SelectionsLayer

    //~ DEBUG
    let debugPositions: [Vector2, string][] = []; //~ for now used for screen space positions of model spheres
    let showMatterDebug: boolean = false;
    let showBoundingSphereDebug: boolean = false;
    let widgetDesign: WidgetStyle = WidgetStyle.Boundary;
    let debugTexts: { text: string; x: number; y: number }[] = [];

    const updateWidgetsScreenPositions = (
        widgets: HWSelectionWidget[],
        bSpheres: BoundingSphere[],
    ): [HWSelectionWidget, HyperWindow, Vector2, number][] => {
        if (widgets.length != bSpheres.length) {
            return [];
        }

        let res: [HWSelectionWidget, HyperWindow, Vector2, number][] = [];
        for (let [i, w] of widgets.entries()) {
            res.push([w, hyperWindows[i], bSpheres[i].center, bSpheres[i].radius]);
        }
        return res;
    };
    
    const newSelection = (
        ev: CustomEvent<{
            selection: Selection;
            sourceWidget: HWSelectionWidget;
            sourceHW: HyperWindow;
        }>,
    ): void => {
        console.log("App: seeing change");
        console.log(ev);
        const sel = ev.detail.selection;
        const sourceWidget = ev.detail.sourceWidget;
        const sourceHyperWindow = ev.detail.sourceHW;

        const newWidgetId = nextAvailableId;
        nextAvailableId += 1;

        const sourceHWPosition = sourceHyperWindow.screenPosition;
        const sourceHWRadius = sourceHyperWindow.currentRadius;
        const newHWScreenPosition = randomPositionAroundHyperWindow(sourceHWPosition, sourceHWRadius / canvasWidth);

        //~ Create the actual new HyperWindow
        const [newHW, newGeo, new3DView, newSelWidget] = makeNewHyperWindow(
            newWidgetId,
            newHWScreenPosition,
            sel,
            sourceWidget,
        );

        hyperWindows = [...hyperWindows, newHW];
        hwModels = [...hwModels, hwModels[0]]; //~ top level (whole) 3D models which are subdivided for individual HyperWindows
        hw3DViews = [...hw3DViews, new3DView]; //~ linearized array with information only relevant for the 3D rendering
        hwWidgets = [...hwWidgets, newSelWidget];

        scene.newHyperWindowAdded(newHW, sourceHyperWindow);
    };

    const default3DView = (): HW3DView => {
        return {
            rotationX: 0,
            rotationY: 0,
            zoom: 1,
            viewSettings: {
                showPivotOrigin: false,
            },
        };
    };

    const makeInitialHyperWindow = (): [HyperWindow, HWGeometry, HW3DView, HWSelectionWidget] | null => {
        //~ 1. load the 3D model (future TODO: multiple models)
        let newModel = undefined;
        if (selectedDataset.name == "brafl") {
            newModel = load3DModel(brafl, 0.02);
        } else if (selectedDataset.name == "cell7") {
            newModel = load3DModel(cell7, 0.2);
        } else if (selectedDataset.name == "spomb") {
            newModel = load3DModel(spomb, 0.1);
        } else {
            return null;
        }

        //~ 2. create selection widget
        const newWidget: HWSelectionWidget = {
            id: 0,
            level: 0,
            binsNum: newModel.spheres.length,
            domain: {
                start: 0,
                end: newModel.spheres.length - 1,
            },
            selections: [],
            colorForSelections: "",
        };

        //~ 3. create 3D view part of HyperWindow
        const new3DView: HW3DView = default3DView();

        //~ 4. create HyperWindow
        const initialRadius = 100;
        const startScreenPosition = new Vector2(0.5, 0.5);
        const newHW: HyperWindow = {
            screenPosition: startScreenPosition,
            currentRadius: initialRadius,
            associatedBodyId: 0,
            associatedBodyIndex: 0, //~ these get filled out in Scene
            model: newModel,
            widget: newWidget,
            threeDView: new3DView,
            childHyperWindows: [],
        };

        return [newHW, newModel, new3DView, newWidget];
    };

    const makeNewHyperWindow = (
        id: number,
        startScreenPosition: Vector2 = new Vector2(0.5, 0.5),
        selection: Selection,
        sourceWidget: HWSelectionWidget, //~ TODO: type
    ): [HyperWindow, HWGeometry, HW3DView, HWSelectionWidget] => {
        const offset = sourceWidget.domain.start;
        const newDomain = {
            start: offset + selection.start,
            end: offset + selection.end,
        };

        //~ Recenter the submodel
        let subModelPositions = hwModels[0].spheres.slice(newDomain.start, newDomain.end + 1);
        subModelPositions = recenter(subModelPositions);
        let subModelTubes = computeTubes(subModelPositions); //~ TODO: probably unnecessary computation

        //~ 1. load the 3D model (future TODO: multiple models)
        const newModel = {
            ...hwModels[0], //~ TODO: still hacky..I should get the model from the source HW
            spheres: subModelPositions,
            tubes: subModelTubes,
        };

        //~ 2. create selection widget
        const newWidget: HWSelectionWidget = {
            id: id,
            level: 0,
            binsNum: newModel.spheres.length,
            domain: {
                start: 0,
                end: newModel.spheres.length - 1,
            },
            selections: [],
            colorForSelections: selection.color,
        };

        //~ 3. create 3D view part of HyperWindow
        const new3DView: HW3DView = default3DView();

        //~ 4. create HyperWindow
        const initialRadius = 100;
        const newHW: HyperWindow = {
            screenPosition: startScreenPosition,
            currentRadius: initialRadius,
            associatedBodyId: 0,
            associatedBodyIndex: 0, //~ these get filled out in Scene
            model: newModel,
            widget: newWidget,
            threeDView: new3DView,
            childHyperWindows: [],
        };

        return [newHW, newModel, new3DView, newWidget];
    };

    const initWithSingle = () => {
        const res = makeInitialHyperWindow();

        if (res == null) {
            return;
        }

        const [hwRoot, hwRootModel, hwRoot3DView, hwRootWidget] = res;

        hyperWindows = [hwRoot];
        hwModels = [hwRootModel];
        hw3DViews = [hwRoot3DView];
        hwWidgets = [hwRootWidget];
    };

    onMount(() => {
        initWithSingle();
    });
</script>

<div id="wrapper">
    <DebugBar onChangeCallback={initWithSingle} bind:showMatterDebug={showMatterDebug} bind:showBoundingSphereDebug={showBoundingSphereDebug} bind:widgetDesign={widgetDesign} {exampleDatasets} bind:selectedDataset={selectedDataset} />
    <div id="canvas-container">
        <!-- Canvas containing 3D models -->
        <Canvas>
            <LayoutOptimizer {hyperWindows} />
            <!-- alternatively I could do this with slots (???) -->
            <!-- <LayoutOptimizer {hyperWindows}> -->
            <!-- <Scene -->
            <!--     bind:this={scene} -->
            <!--     bind:canvasWidth -->
            <!--     bind:canvasHeight -->
            <!--     bind:boundingSpheres -->
            <!--     bind:debugPositions -->
            <!--     bind:debugTexts -->
            <!--     bind:camera -->
            <!--     {showMatterDebug} -->
            <!--     {matterjsDebugCanvas} -->
            <!-- /> -->
            <!-- </LayoutOptimizer> -->
            
        </Canvas>

        <!-- SVG debug overlay -->
        {#if showBoundingSphereDebug}
            <DebugOverlay {canvasWidth} {canvasHeight} {boundingSpheres} {debugPositions} {debugTexts} />
        {/if}

        <!-- SVG-based layer with selection widgets for each 3D (sub)model -->
        <SelectionsLayer
            width={canvasWidth}
            height={canvasHeight}
            widgets={hwWidgets}
            {hyperWindows}
            {boundingSpheres}
            {selectionWidgetThickness}
            newSelectionCallback={newSelection}
            {widgetDesign}
        />

        <!-- placeholder for Matter.js debug view -->
        <canvas id="matterjs-debug" width={canvasWidth} height={canvasHeight} bind:this={matterjsDebugCanvas} />
    </div>
</div>

<style>
    #wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    #canvas-container {
        width: 100%;
        height: 100%;
        flex: 1;
        overflow: hidden;
    }

    #matterjs-debug {
        position: absolute;
        top: 0;
        left: 0;
        opacity: 50%;
        pointer-events: none;
    }
</style>
