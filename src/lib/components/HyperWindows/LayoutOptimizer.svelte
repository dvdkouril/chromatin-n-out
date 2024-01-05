<script lang="ts">
    import { onMount } from "svelte";
    //~ three, threlte, matter
    import { Vector2, type PerspectiveCamera } from "three";
    import { Canvas } from "@threlte/core";
    import Matter from "matter-js";
    //~ my own types and components
    import Scene from "./Scene.svelte";
    import SelectionsLayer from "./SelectionsLayer.svelte";
    import type { BoundingSphere, HWSelectionWidget, HyperWindow, HyperWindowsLayout, Selection, WidgetStyle } from "$lib/hyperwindows-types";
    import { uvToScreen } from "$lib/util";

    //~ Matter.js physics
    let matterEngine = Matter.Engine.create();
    let matterRender: Matter.Render | undefined = undefined;
    let matter_bodies: Matter.Body[] = [];
    let matter_body_ids: number[] = [];

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
    let bodiesInitialized = false;

    //~ Main data structures: HyperWindows, widgets, and their positioning on the canvas
    export let hyperWindows: HyperWindow[];
    export let hwWidgets: HWSelectionWidget[];
    export let hwLayout: HyperWindowsLayout;

    //~ TODO: move to LayoutOptimizer!
    let bodyToHWLookup = new Map<number, HyperWindow>();

    //~ Reactivity: for when we add/remove hyperwindows
    $: updateBodies(hyperWindows);

    export let newSelectionCallback: (
        ev: CustomEvent<{
            selection: Selection;
            sourceWidget: HWSelectionWidget;
            sourceHW: HyperWindow;
        }>,
    ) => void;
    export let widgetDesign: WidgetStyle; //~ TODO: I'm pretty sure this shouldn't be here

    //~ copied from elsewhere
    let scene: Scene;
    let canvasWidth = 800; //~ binding these upwards with useThrelte
    let canvasHeight = 600;
    $: sizeChanged(canvasWidth, canvasHeight);
    
    let boundingSpheres: BoundingSphere[] = []; //~ bound to Scene, returns bounding spheres
    let debugTexts: { text: string; x: number; y: number }[] = [];
    let camera: PerspectiveCamera;

    //~ TODO: candidate for a store?
    export let showMatterDebug: boolean = false;
    export let matterjsDebugCanvas: HTMLCanvasElement | undefined = undefined;


    /*
      Update bodies based on changed hyperwindows.
      Current use cases in mind:
      - init (first hyperwindows are empty => can't create bodies onMount)
      - added a new HW (although do I want to remove all previous HW bodies?)
    */
    const updateBodies = (hws: HyperWindow[]) => {
        console.log("LayoutOptimizer::updateBodies");
        console.log(hws.length);

        //~ TODO: this is probably wrong! just testing;
        Matter.Composite.remove(matterEngine.world, matter_bodies);
        initializePhysicsBodies();
    };

    //~ use case in mind: actually idk, lol
    //~ cause mainly the positions should change because of the physics
    //~ and that gets updated here in this component
    const updateBodiesPositions = (layout: HyperWindowsLayout) => {
        console.log(layout.num);
    };

    const sizeChanged = (width: number, height: number) => {
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

        reconfigureWalls(width, height);
    };

    $: toggleMatterDebugView(showMatterDebug);
    const toggleMatterDebugView = (show: boolean) => {
        if (matterRender == undefined) {
            initMatterDebugView();
        }

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

    const initMatterDebugView = () => {
        if (matterRender != undefined) return;

        if (matterjsDebugCanvas == undefined) {
            console.log("matterjsDebugCanvas is undefined!");
            return;
        }
 
        // create a renderer
        matterRender = Matter.Render.create({
            canvas: matterjsDebugCanvas,
            engine: matterEngine,
            options: { width: canvasWidth, height: canvasHeight },
        });
    };
    
    const initializePhysicsBodies = () => {
        //~ creating the bodies here
        let bodies = [];
        let ids = [];
        bodyToHWLookup.clear();
        for (let i = 0; i < hwLayout.num; i++) {
            //~ <0, 1> -> <0, width/height>
            const position = hwLayout.centers[i];
            const radius = hwLayout.radii[i];
            // const c = uvToScreen(hw.screenPosition, canvasWidth, canvasHeight);
            const c = position;
            const newBody = Matter.Bodies.circle(c.x, c.y, radius, {
                restitution: 0,
                friction: 1,
            });
            // hw.associatedBodyId = newBody.id;
            // hw.associatedBodyIndex = i; //~ one of these is redundant but i can't say which rn
            bodies.push(newBody);
            ids.push(newBody.id);
            //~ I'm not 100% sure about the hyperWindows[i] access
            bodyToHWLookup.set(newBody.id, hyperWindows[i]);
        }
        matter_bodies = bodies;
        matter_body_ids = ids;

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

    export const addBodyForNewHyperWindow = () => {
        //~ basically do what happens in the function below
    };

    // export const newHyperWindowAdded = (newHW: HyperWindow, sourceHW: HyperWindow) => {
    //     ////~ TODO: I think this is the part that needs to be reworked the most, so I'm commenting it out for now
    //     // const startWorlPosition = camera ? unprojectToWorldSpace(newHW.screenPosition, camera) : new Vector3(0, 0, 0);
    //     // newHW.model.modelWorldPosition = startWorlPosition;
    //     //
    //     // const [_, radius] = computeBoundingSphere(newHW, camera);
    //     // newHW.currentRadius = radius;
    //     //
    //     // // broken code follows:
    //     // const c = new Vector2(newHW.screenPosition.x * canvasWidth, newHW.screenPosition.y * canvasHeight);
    //     // // const newBody = Matter.Bodies.circle(c.x, c.y, initialRadius, {
    //     // const newBody = Matter.Bodies.circle(c.x, c.y, newHW.currentRadius, {
    //     //     restitution: 0,
    //     //     friction: 1,
    //     // });
    //     // newHW.associatedBodyId = newBody.id;
    //     // newHW.associatedBodyIndex = matter_bodies.length;
    //     // // (hw.associatedBodyIndex = i), //~ one of these is redundant but i can't say which rn
    //     // matter_bodies.push(newBody);
    //     // matter_body_ids.push(newBody.id);
    //     // // i += 1;
    //     //
    //     // // matter_bodies = bodies;
    //     // // matter_body_ids = ids;
    //     //
    //     // const sourceHWBody = matter_bodies[sourceHW.associatedBodyIndex];
    //     // var constraint = Matter.Constraint.create({
    //     //     bodyA: sourceHWBody,
    //     //     bodyB: newBody,
    //     //     stiffness: 0.001,
    //     //     damping: 0.05,
    //     // });
    //     //
    //     // //~ add bodies to the Matterjs engine's world
    //     // Matter.Composite.add(engine.world, [newBody, constraint]);
    //     // console.log("new selection -> new hyperwindow added -> should add new body!");
    //     //
    //     // // hyperWindows.push(newHW); //~ just temporarily, until next "update"
    //     // // recomputeBoundingSpheres(hyperWindows);
    // };

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

    const update = () => {
        //~ poll the Matter physics and update positions of HyperWindows
        let newLayout: HyperWindowsLayout = {
            num: 0,
            centers: [],
            radii: [],
        };
        for (let b of matter_bodies) {
            newLayout.centers.push(new Vector2(b.position.x, b.position.y));
            newLayout.radii.push(b.circleRadius || 0);
            newLayout.num += 1;
        }
        hwLayout = newLayout;

        requestAnimationFrame(update); 
    };

    onMount(() => {
        matterEngine.gravity.y = 0;
        var runner = Matter.Runner.create();
        Matter.Runner.run(runner, matterEngine);

        initMatterDebugView();

        if (canvasWidth != 0 && canvasHeight != 0) {
            initializePhysicsBodies();
            bodiesInitialized = true;
        }

        console.log("LayoutOptimizer::onMount");

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
        bind:canvasWidth
        bind:canvasHeight
        bind:boundingSpheres
        bind:debugTexts
        bind:camera
        {getHyperWindowAtPosition}
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
/>
