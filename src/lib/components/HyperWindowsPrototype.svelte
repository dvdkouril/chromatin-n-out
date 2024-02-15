<script lang="ts">
    import type { Euler, Vector2, Vector3 } from "three";
    import DebugOverlay from "./HyperWindows/DebugOverlay.svelte";
    import { onMount } from "svelte";
    import { brafl } from "../test_BRAFL";
    import { spomb } from "../test_SPOMB";
    import { computeTubes, load3DModel, recenter } from "../util";
    import {
        type HWGeometry,
        type HWSelectionWidget,
        type HyperWindow,
        type HW3DView,
        type BoundingSphere,
        type Selection, 
        WidgetStyle,
        default3DView,
        defaultSelectionWidget,
        type SpatialSelection,
    } from "$lib/hyperwindows-types";
    import { cell7 } from "$lib/test_cell7";
    import DebugBar from "./HyperWindows/DebugBar.svelte";
    import LayoutOptimizer from "./HyperWindows/LayoutOptimizer.svelte";
    import { canvasSize } from "$lib/stores";

    //~ internal state
    let canvasWidth = 800; //~ binding these upwards with useThrelte
    let canvasHeight = 600;
    let nextAvailableId = 0; 
    let widgetDesign: WidgetStyle = WidgetStyle.Boundary;
    let showAllWidgets = true;

    type Dataset = {
        id: number;
        name: string;
        scale: number;
    };

    type Scene = {
        id: number;
        name: string;
        datasetNames: string[];
    };

    //~ example dataset selection
    const exampleDatasets: Map<string, Dataset> = new Map([
        ["brafl", { id: 1, name: "brafl", scale: 0.02 }],
        ["spomb", { id: 2, name: "spomb", scale: 0.1 }],
        ["cell7", { id: 3, name: "cell7", scale: 0.2 }],
    ]);
    const exampleScenes: Scene[] = [
        { id: 1, name: "brafl", datasetNames: ["brafl"] },
        { id: 2, name: "spomb", datasetNames: ["spomb"] },
        { id: 3, name: "cell7", datasetNames: ["cell7"] },
        { id: 4, name: "brafl+spomb", datasetNames: ["brafl", "spomb"] },
        { id: 5, name: "brafl+brafl", datasetNames: ["brafl", "brafl"] },
    ];
    let selectedScene: Scene = exampleScenes[0];

    //~ Main data structures
    let hyperWindows: HyperWindow[] = [];
    let hwModels: HWGeometry[] = []; //~ top level (whole) 3D models which are subdivided for individual HyperWindows
    let hw3DViews: HW3DView[] = []; //~ linearized array with information only relevant for the 3D rendering
    let hwWidgets: HWSelectionWidget[] = []; //~ linearized array with information only relevant for the selection widget
    let rootModelSizes: number[] = [];

    //~ refs to other components
    let layoutOptimizer: LayoutOptimizer;

    //~ Structures related to computation of the bounding sphere and final screen positions
    let boundingSpheres: BoundingSphere[] = []; //~ bound to Scene, returns bounding spheres

    //~ DEBUG
    let debugPositions: [Vector2, string][] = []; //~ for now used for screen space positions of model spheres
    let showMatterDebug: boolean = false;
    let matterjsDebugCanvas: HTMLCanvasElement | undefined = undefined;
    let showBoundingSphereDebug: boolean = false;
    let debugTexts: { text: string; x: number; y: number }[] = [];

    $: sizeChanged($canvasSize); 

    const sizeChanged = (size: { width: number, height: number }) => {
        canvasWidth = size.width;
        canvasHeight = size.height;
    };

    const newSelection = (
        ev: CustomEvent<{
            selection: Selection;
            sourceWidget: HWSelectionWidget;
            sourceHW: HyperWindow;
        }>,
    ): void => {
        console.log("New Selection: adding new HyperWindow");
        const sel = ev.detail.selection;
        const sourceWidget = ev.detail.sourceWidget;
        const sourceHyperWindow = ev.detail.sourceHW;

        const newWidgetId = nextAvailableId;
        nextAvailableId += 1;

        //~ Create the actual new HyperWindow
        const [newHW, _, new3DView, newSelWidget] = makeNewHyperWindow(
            newWidgetId,
            sel,
            sourceWidget,
        );

        hyperWindows = [...hyperWindows, newHW];
        hwModels = [...hwModels, hwModels[0]]; //~ top level (whole) 3D models which are subdivided for individual HyperWindows
        hw3DViews = [...hw3DViews, new3DView]; //~ linearized array with information only relevant for the 3D rendering
        hwWidgets = [...hwWidgets, newSelWidget];

        layoutOptimizer.addNewHyperWindowToLayout(newHW, sourceHyperWindow);
    };

    const newSpatialSelection = (
        ev: CustomEvent<{
            selection: SpatialSelection;
            sourceHWId: number;
        }>,
    ) => {
        console.log("newSpatialSelection !!!");
        console.log(ev.detail.selection);
        console.log(ev.detail.sourceHWId);

        // const newWidgetId = nextAvailableId;
        const newHWId = nextAvailableId;
        nextAvailableId += 1;

        const sourceHyperWindow = hyperWindows[ev.detail.sourceHWId];

        //~ Create the actual new HyperWindow
        const [newHW, _, new3DView, newSelWidget] = makeNewHyperWindowAfterSpatialSelection(
            newHWId,
            ev.detail.selection,
            sourceHyperWindow ,
        );

        hyperWindows = [...hyperWindows, newHW];
        hwModels = [...hwModels, hwModels[0]]; //~ top level (whole) 3D models which are subdivided for individual HyperWindows
        hw3DViews = [...hw3DViews, new3DView]; //~ linearized array with information only relevant for the 3D rendering
        hwWidgets = [...hwWidgets, newSelWidget];

        layoutOptimizer.addNewHyperWindowToLayout(newHW, sourceHyperWindow);
    };



    //~ TODO: this should probably be unified with the function below
    const makeNewHyperWindowAfterSpatialSelection = (
        id: number,
        selection: SpatialSelection,
        sourceHW: HyperWindow
    ): [HyperWindow, HWGeometry, HW3DView, HWSelectionWidget] => {

        const sourceWidget = sourceHW.widget;
        //~ Recenter the submodel
        const offset = sourceWidget.domain.start;
        let subModelPositions: Vector3[] = [];
        for (let i = 0; i < selection.bins.length; i++) {
            const binId = selection.bins[i] + offset;
            const binPos = sourceHW.model.spheres[binId];
            subModelPositions.push(binPos);
        }

        //~ essentially, I need a list of all positions to recenter
        //~ => that's what subModelPositions is
        subModelPositions = recenter(subModelPositions);

        const connectedBinPositions = [];
        let globalIndex = 0;
        for (let i = 0; i < selection.connectedBins.length; i++) {
            const arr = selection.connectedBins[i];
            let posArr: Vector3[] = [];
            for (let j = 0; j < arr.length; j++) {
                posArr.push(subModelPositions[globalIndex]);
                globalIndex += 1;
            }
            connectedBinPositions.push(posArr);
        }

        let allTubes: {position: Vector3; rotation: Euler; scale: number}[] = [];
        for (let i = 0; i < connectedBinPositions.length; i++) {
            const tubes = computeTubes(connectedBinPositions[i]);
            allTubes = [...allTubes, ...tubes];
        }
        // let subModelTubes = computeTubes(subModelPositions); //~ TODO: probably unnecessary computation

        //~ 1. load the 3D model 
        const newModel = {
            ...hwModels[sourceWidget.treeId], 
            spheres: subModelPositions,
            tubes: allTubes,
        };

        //~ 2. create selection widget
        const newWidget: HWSelectionWidget = {
            id: id,
            level: 0,
            treeId: sourceWidget.treeId,
            binsNum: newModel.spheres.length,
            domain: {
                start: 0,
                end: newModel.spheres.length - 1,
            },
            selections: [],
            // colorForSelections: selection.color,
            colorForSelections: "#ff0000",
        };

        //~ 3. create 3D view part of HyperWindow
        const new3DView: HW3DView = default3DView();

        //~ 4. create HyperWindow
        const newHW: HyperWindow = {
            id: id,
            model: newModel,
            widget: newWidget,
            threeDView: new3DView,
            childHyperWindows: [],
        };

        return [newHW, newModel, new3DView, newWidget];
    };

    const makeNewHyperWindow = (
        id: number,
        selection: Selection,
        sourceWidget: HWSelectionWidget, 
    ): [HyperWindow, HWGeometry, HW3DView, HWSelectionWidget] => {
        const offset = sourceWidget.domain.start;
        const newDomain = {
            start: offset + selection.start,
            end: offset + selection.end,
        };

        //~ Recenter the submodel
        let subModelPositions = hwModels[sourceWidget.treeId].spheres.slice(newDomain.start, newDomain.end + 1);
        subModelPositions = recenter(subModelPositions);
        let subModelTubes = computeTubes(subModelPositions); //~ TODO: probably unnecessary computation

        //~ 1. load the 3D model 
        const newModel = {
            ...hwModels[sourceWidget.treeId], 
            spheres: subModelPositions,
            tubes: subModelTubes,
        };

        //~ 2. create selection widget
        const newWidget: HWSelectionWidget = {
            id: id,
            level: 0,
            treeId: sourceWidget.treeId,
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
        const newHW: HyperWindow = {
            id: id,
            model: newModel,
            widget: newWidget,
            threeDView: new3DView,
            childHyperWindows: [],
        };

        return [newHW, newModel, new3DView, newWidget];
    };

    const makeInitialHyperWindows = (datasets: Dataset[]): [HyperWindow[], HWGeometry[], HW3DView[], HWSelectionWidget[]] | null => {
        let hws: HyperWindow[] = [];
        let models: HWGeometry[] = [];
        let views: HW3DView[] = [];
        let widgets: HWSelectionWidget[] = [];

        for (let d of datasets) {
            let model: HWGeometry | null = null;
            //~ todo: move to a different function
            if (d.name == "brafl") {
                model = load3DModel(brafl, d.scale);
            } else if (d.name == "spomb") {
                model = load3DModel(spomb, d.scale);
            } else if (d.name == "cell7") {
                model = load3DModel(cell7, d.scale);
            }

            if (!model) {
                return null;
            }

            const widget: HWSelectionWidget = defaultSelectionWidget(nextAvailableId, nextAvailableId, model.spheres.length);
            const view: HW3DView = default3DView();
            const hw = {
                id: nextAvailableId,
                model: model,
                widget: widget,
                threeDView: view,
                childHyperWindows: [],
            };

            nextAvailableId = nextAvailableId + 1;

            hws = [...hws, hw];
            models = [...models, model];
            views = [...views, view];
            widgets = [...widgets, widget];

        }
        rootModelSizes = models.map(m => m.spheres.length);

        return [hws, models, views, widgets];
    };

    const fetchDatasetsForScene = (scene: Scene): Dataset[] | null => {
        //~ Use the datasetNames to fetch Dataset structure
        const datasets = scene.datasetNames.map(s => exampleDatasets.get(s));

        //~ Check whether there's some typo or something which would result into not finding the dataset
        if (datasets.includes(undefined)) {
            return null;
        }

        //~ Because of the check above, this cast should be possible
        return datasets as Dataset[];
    };

    const initHyperWindows = () => {
        const datasets = fetchDatasetsForScene(selectedScene);
        
        if (!datasets) {
            return;
        }

        //~ reseting, for when this is run after dataset changed
        layoutOptimizer.reset();
        nextAvailableId = 0;

        const res = makeInitialHyperWindows(datasets);

        if (res == null) {
            return;
        }

        const [hws, models, views, widgets] = res;

        hyperWindows = hws;
        hwModels = models;
        hw3DViews = views;
        hwWidgets = widgets;

    };

    onMount(() => {
        console.log("HyperWindowsPrototype::onMount");
        initHyperWindows();
    });
</script>

<div id="wrapper">
    <DebugBar onChangeCallback={initHyperWindows} bind:showMatterDebug={showMatterDebug} bind:showBoundingSphereDebug={showBoundingSphereDebug} bind:widgetDesign={widgetDesign} {exampleScenes} bind:selectedScene={selectedScene} bind:showAllWidgets={showAllWidgets} />

    <div id="canvas-container">
        <!-- Manages the positioning of HyperWindows (both the 3D part and the SelectionWidget) -->
        <LayoutOptimizer bind:this={layoutOptimizer} {hyperWindows} {hwWidgets} on:selectionFinished={newSelection} on:spatialSelectionFinished={newSpatialSelection} {widgetDesign} {matterjsDebugCanvas} {showMatterDebug} {rootModelSizes} showingAllWidgets={showAllWidgets} />

        <!-- SVG debug overlay -->
        {#if showBoundingSphereDebug}
            <DebugOverlay {canvasWidth} {canvasHeight} {boundingSpheres} {debugPositions} {debugTexts} />
        {/if}

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
