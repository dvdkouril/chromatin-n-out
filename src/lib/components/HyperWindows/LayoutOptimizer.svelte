<script lang="ts">
    import { onMount } from "svelte";
    //~ three, threlte, matter
    import { Vector2, type PerspectiveCamera } from "three";
    import { Canvas } from "@threlte/core";
    import Matter from "matter-js";
    //~ my own types and components
    import Scene from "./Scene.svelte";
    import SelectionsLayer from "./SelectionsLayer.svelte";
    import type { HWSelectionWidget, HyperWindow, HyperWindowsLayout, Selection, WidgetStyle } from "$lib/hyperwindows-types";
    import { canvasSize } from "$lib/stores";
    import { uvToScreen, randomPositionAroundHyperWindow } from "$lib/util";

    //~ Matter.js physics
    let matterEngine = Matter.Engine.create();
    let matterRender: Matter.Render | undefined = undefined;

    type WallBodies = {
        top: Matter.Body | undefined,
        bottom: Matter.Body | undefined,
        left: Matter.Body | undefined,
        right: Matter.Body | undefined
    };

    let wallBodies: WallBodies = {
        top: undefined,
        bottom: undefined,
        left: undefined,
        right: undefined,
    }; 

    //~ Main data structures: HyperWindows, widgets, and their positioning on the canvas
    export let hyperWindows: HyperWindow[];
    export let hwWidgets: HWSelectionWidget[];
    export let rootModelSizes: number[];
    let hwLayout: HyperWindowsLayout = {
        num: 0,
        centers: [],
        radii: [],
    };

    let bodyToHWLookup = new Map<number, HyperWindow>();

    type HyperWindowPhysicsData = {
        body: Matter.Body,
        constraints: Matter.Constraint[];
    };

    let hwPhysicsData: HyperWindowPhysicsData[] = [];

    //~ Reactivity: for when we add/remove hyperwindows
    $: hyperWindowsChanged(hyperWindows);

    export let newSelectionCallback: (
        ev: CustomEvent<{
            selection: Selection;
            sourceWidget: HWSelectionWidget;
            sourceHW: HyperWindow;
        }>,
    ) => void;
    export let widgetDesign: WidgetStyle; //~ TODO: I'm pretty sure this shouldn't be here
    export let showingAllWidgets: boolean;

    //~ copied from elsewhere
    let scene: Scene;
    let canvasWidth = 800;
    let canvasHeight = 600;
    // $: sizeChanged(canvasWidth, canvasHeight);
    $: sizeChanged($canvasSize);
    
    //let boundingSpheres: BoundingSphere[] = []; //~ bound to Scene, returns bounding spheres
    //let debugTexts: { text: string; x: number; y: number }[] = [];
    let camera: PerspectiveCamera;

    //~ TODO: candidate for a store?
    export let showMatterDebug: boolean = false;
    export let matterjsDebugCanvas: HTMLCanvasElement | undefined = undefined;
    $: initMatterDebugView(matterjsDebugCanvas, matterEngine);

    /*
     * Solving the initialization problem: I can't set up anything until I have some stuff
     */
    let layoutInitialized = false;
    // let bodiesInitialized = false;
    $: initializePhysicsSim(hyperWindows, canvasWidth, canvasHeight);

    const initializePhysicsSim = (hws: HyperWindow[], width: number, height: number) => {
        console.log("initializePhysicsSim");
        console.log(layoutInitialized);
        if (layoutInitialized) { //~ if already initialized, do nothing else
            return;
        }

        if ((hws == undefined) || (hws.length == 0)) {
            //~ if no hyperwindows ready, do nothing, try again later
            return;
        }

        if ((width == 0) || (height == 0)) {
            //~ if the canvas has zero size, do nothing, try again later
            return;
        }

        if (!scene) {
            //~ if Scene hasn't been bound yet, do nothing, try again later
            return;
        }

        initializeLayout();
        initializePhysicsBodies();
        layoutInitialized = true;
    };

    /*
      On changed hyperwindows: the only times that happens is when:
      - init (first hyperwindows are empty => can't create bodies onMount)
      - added a new HW (although do I want to remove all previous HW bodies?)
    */
    const hyperWindowsChanged = (hws: HyperWindow[]) => {
        console.log("LayoutOptimizer::hyperWindowsChanged (hws:" + hws.length + ")");
        console.log("layout.num = " + hwLayout.num);

        // if (!layoutInitialized) {
        //     console.log("initializing layout: another try");
        //     initializeLayout();
        // }

        //~ TODO: this is probably wrong! just testing;
        // Matter.Composite.remove(matterEngine.world, matter_bodies);
        // initializePhysicsBodies();
    };

    //~ use case in mind: actually idk, lol
    //~ cause mainly the positions should change because of the physics
    //~ and that gets updated here in this component
    // const updateBodiesPositions = (layout: HyperWindowsLayout) => {
    //     console.log(layout.num);
    // };

    // const sizeChanged = (width: number, height: number) => {
    const sizeChanged = (size: { width: number, height: number }) => {
        // previousCanvasWidth = canvasWidth;
        // previousCanvasHeight = canvasHeight;
        // canvasWidth = size.width;
        // canvasHeight = size.height;

        //~ let's see what happens if I just don't do this
        // if ((previousCanvasWidth == 0 || previousCanvasHeight == 0) && canvasWidth != 0 && canvasHeight != 0) {
        //     if (!bodiesInitialized) {
        //         initializePhysicsBodies();
        //         bodiesInitialized = true;
        //     }
        // }

        canvasWidth = size.width;
        canvasHeight = size.height;

        reconfigureWalls(canvasWidth, canvasHeight);
    };

    $: toggleMatterDebugView(showMatterDebug);
    const toggleMatterDebugView = (show: boolean) => {
        // if (matterRender == undefined) {
        //     initMatterDebugView();
        // }

        if ((matterjsDebugCanvas == undefined) || (matterRender == undefined)) {
            return;
        }

        if (show == true) {
            Matter.Render.run(matterRender);
        } else {
            Matter.Render.stop(matterRender);

            const context = matterjsDebugCanvas.getContext("2d");
            if (context == null) {
                return;
            }
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            matterjsDebugCanvas.style.background = "none";
        }
    };

    const initMatterDebugView = (
        debugCanvas: HTMLCanvasElement | undefined,
        engine: Matter.Engine
    ) => {
        // if (matterRender != undefined) return;

        if (debugCanvas == undefined) {
            console.log("matterjsDebugCanvas is undefined!~");
            return;
        }
 
        // create a renderer
        matterRender = Matter.Render.create({
            canvas: debugCanvas,
            engine: engine,
            options: { width: canvasWidth, height: canvasHeight },
        });
    };
    
    const initializePhysicsBodies = () => {
        if (hwLayout == undefined) {
            console.log("ERR: hwLayout is undefined");
            return;
        }
        //~ creating the bodies here
        hwPhysicsData = [];
        const bodies: Matter.Body[] = [];
        bodyToHWLookup.clear();
        for (let i = 0; i < hwLayout.num; i++) {
            //~ <0, 1> -> <0, width/height>
            const position = hwLayout.centers[i];
            const radius = hwLayout.radii[i];
            const c = position;
            const newBody = Matter.Bodies.circle(c.x, c.y, radius, {
                restitution: 0,
                friction: 1,
                frictionAir: 1,
            });
            bodies.push(newBody);
            hwPhysicsData.push({
                body: newBody,
                constraints: [],
            });
            //~ I'm not 100% sure about the hyperWindows[i] access
            bodyToHWLookup.set(newBody.id, hyperWindows[i]);
        }

        //~ add bodies to the Matterjs engine's world
        Matter.Composite.add(matterEngine.world, bodies);
        console.log("initialized physics bodies.");
    };
    
    const reconfigureWalls = (newCanvasWidth: number, newCanvasHeight: number) => {
        console.log("Reconfiguring walls to " + newCanvasWidth + " x " + newCanvasHeight);

        const w = newCanvasWidth;
        const h = newCanvasHeight;
        const thickness = 50;
        var ground = Matter.Bodies.rectangle(w / 2, h, w, thickness, {
            isStatic: true,
        });
        var leftWall = Matter.Bodies.rectangle(0, h / 2, thickness, h, {
            isStatic: true,
        });
        var rightWall = Matter.Bodies.rectangle(w, h / 2, thickness, h, {
            isStatic: true,
        });
        var topWall = Matter.Bodies.rectangle(w / 2, 0, w, thickness, {
            isStatic: true,
        });

        //~ remove old
        if (wallBodies.top != undefined && wallBodies.bottom != undefined && wallBodies.left != undefined && wallBodies.right != undefined) {
            Matter.Composite.remove(matterEngine.world, [wallBodies.top, wallBodies.bottom, wallBodies.left, wallBodies.right]);
        }

        wallBodies.bottom = ground;
        wallBodies.top = topWall;
        wallBodies.left = leftWall;
        wallBodies.right = rightWall;

        // add all of the bodies to the world
        Matter.Composite.add(matterEngine.world, [ground, leftWall, rightWall, topWall]);
    };

    const layoutLookup = (hwId: number): { center: Vector2, radius: number } | undefined => {
        if (hwId >= hwLayout.num) {
            return undefined;
        }

        return {
            center: hwLayout.centers[hwId],
            radius: hwLayout.radii[hwId],
        };
        
    };
    const checkBoundsAndCorrect = (pos: Vector2, rad: number, w: number, h: number) : Vector2 => {
        let targetOnBorder = pos.clone();
        targetOnBorder.clamp(new Vector2(0 + rad, 0 + rad), new Vector2(w - rad, h - rad));
        return targetOnBorder;
    };

    export const addNewHyperWindowToLayout = (newHW: HyperWindow, sourceHW: HyperWindow) => {
        const hwLayoutInfo = layoutLookup(sourceHW.id);

        if (hwLayoutInfo  == undefined) {
            console.log("ERR: cannot lookup hyperwindow in layout!");
            return;
        }

        let [_, radius] = scene.computeBoundingSphere(newHW);
        let pos = randomPositionAroundHyperWindow(hwLayoutInfo.center, hwLayoutInfo.radius, radius);
        const rad = radius;
        pos = checkBoundsAndCorrect(pos, rad, canvasWidth, canvasHeight);
        //~ add to layout
        hwLayout.num += 1;
        hwLayout.centers.push(pos); 
        hwLayout.radii.push(rad); 

        //~ add new body
        const newBody = Matter.Bodies.circle(pos.x, pos.y, rad, {
            restitution: 0,
            friction: 1,
            frictionAir: 1,
        });
        

        const sourceHWBody = hwPhysicsData[sourceHW.id].body;
        const constraint = Matter.Constraint.create({
            bodyA: sourceHWBody,
            bodyB: newBody,
            stiffness: 0.001,
            damping: 0.1,
        });

        //~ Update internal data structures about physics objects
        //~ new body and constraint
        hwPhysicsData.push({
            body: newBody,
            constraints: [constraint],
        });
        //~ add constraint to source body
        hwPhysicsData[sourceHW.id].constraints.push(constraint);

        bodyToHWLookup.set(newBody.id, newHW);

        Matter.Composite.add(matterEngine.world, [newBody, constraint]);
        hwLayout = hwLayout;
    }

    export const addBodyForNewHyperWindow = () => {
        //~ basically do what happens in the function below
        hwLayout.num += 1;
    };
    
    /*
     * Provided to the Scene to access the engine during interactions
     */
    const getHyperWindowAtPosition = (x: number, y: number): HyperWindow | undefined => {
        //~ use the x,y to query the physics engine; get the body under cursor
        let hitBodies = Matter.Query.point(matterEngine.world.bodies, { x: x, y: y });
        if (hitBodies.length > 0) {
            let b = hitBodies[0]; //~ assume for now that we don't have overlapping bodies
            const bodyId = b.id;

            if (!bodyToHWLookup.has(bodyId)) {
                return undefined;
            }
            let hprWindow = bodyToHWLookup.get(bodyId);
            return hprWindow;
        }
        return undefined;
    };

    const needToScaleBodyForHyperWindow = (hw: HyperWindow, scaleFactor: number) => {
        const b = hwPhysicsData[hw.id].body;
        Matter.Body.scale(b, scaleFactor, scaleFactor);
        //~ hm, if I want to adjust the radius in layout, it becames really significantly choppy...
        // const prevRadius = hwLayout.radii[hw.id];
        // hwLayout.radii[hw.id] = prevRadius * scaleFactor;

        //~ adjusting the constraints 
        const constrs = hwPhysicsData[hw.id].constraints;
        const prevRadius = hwLayout.radii[hw.id];
        for (let c of constrs) {
            const currentLength = c.length;
            const delta = prevRadius * scaleFactor - prevRadius;
            c.length = currentLength + delta;
        }
    };

    const update = () => {
        //~ poll the Matter physics and update positions of HyperWindows
        let newLayout: HyperWindowsLayout = {
            num: 0,
            centers: [],
            radii: [],
        };
        for (let data of hwPhysicsData) {
            const b = data.body;
            newLayout.centers.push(new Vector2(b.position.x, b.position.y));
            newLayout.radii.push(b.circleRadius || 0);
            newLayout.num += 1;
        }
        hwLayout = newLayout;

        requestAnimationFrame(update); 
    };

    const initializeLayout = () => {
        let newLayout: HyperWindowsLayout = {
            num: 0,
            centers: [],
            radii: [],
        };

        for (let i = 0; i < hyperWindows.length; i++) {
            let [_, radius] = scene.computeBoundingSphere(hyperWindows[i]);
            const initialRadius = radius;
            const startScreenPosition = new Vector2(0.5, 0.5);
            newLayout = {
                num: newLayout.num + 1,
                centers: [...newLayout.centers, uvToScreen(startScreenPosition, canvasWidth, canvasHeight)],
                radii: [...newLayout.radii, initialRadius],
            };
        }

        hwLayout = newLayout;
    };

    export const reset = () => {
        hwLayout = {
            num: 0,
            centers: [],
            radii: [],
        };
        layoutInitialized = false;

        const allHwBodies = hwPhysicsData.map(data => data.body);
        const allHwConstraints = hwPhysicsData.flatMap(data => data.constraints);
        Matter.Composite.remove(matterEngine.world, allHwBodies);
        Matter.Composite.remove(matterEngine.world, allHwConstraints);
        hwPhysicsData = [];
        bodyToHWLookup = new Map<number, HyperWindow>();
    };

    onMount(() => {
        console.log("LayoutOptimizer::onMount");
        matterEngine.gravity.y = 0;
        matterEngine.positionIterations = 10;
        var runner = Matter.Runner.create();
        Matter.Runner.run(runner, matterEngine);

        // initMatterDebugView(); //~ can't init here cause we still don't have the debug canvas

        // initializeLayout(); //~ can't init because I don't have any hws

        //~ can't init because width/height are still zero 
        // if ((canvasWidth != 0) && (canvasHeight != 0) && (hwLayout != undefined)) {
        //     initializePhysicsBodies();
        //     bodiesInitialized = true;
        // }

        requestAnimationFrame(update);

    });
</script>

<!--
@component
The purpose of LayoutOptimizer is to manage all the Matter.js logic behind placing HyperWindows around the canvas.

-->
<!-- Canvas containing 3D models -->
<Canvas>
    <Scene
        {hyperWindows}
        {hwLayout}
        bind:this={scene}
        bind:camera
        {getHyperWindowAtPosition}
        {needToScaleBodyForHyperWindow}
    />
</Canvas>

<!-- SVG-based layer with selection widgets for each 3D (sub)model -->
<SelectionsLayer
    width={canvasWidth}
    height={canvasHeight}
    widgets={hwWidgets}
    {hyperWindows}
    layout={hwLayout}
    {newSelectionCallback}
    {widgetDesign}
    {rootModelSizes}
    {showingAllWidgets}
/>
