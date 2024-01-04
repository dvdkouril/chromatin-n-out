<script lang="ts">
    import Scene from "./Scene.svelte";
    import { Vector2, Vector3, type PerspectiveCamera } from "three";
    import type { BoundingSphere, HyperWindow } from "$lib/hyperwindows-types";
    import Matter from "matter-js";
    import { onMount } from "svelte";
    import { useThrelte, useFrame, type Size } from "@threlte/core";
    import { unprojectToWorldSpace } from "$lib/util";

    let hyperWindowsPositions: Vector2[] = [];
    /**
     * TODO: 
     * - listening to changes in bounding spheres from Scene
     * - useFrame for synchronizing physics with hyperWindowsPositions
     */

    //~ Matter.js physics
    let engine = Matter.Engine.create();
    let matterRender: Matter.Render | undefined = undefined;
    let matter_bodies: Matter.Body[] = [];
    let matter_body_ids: number[] = [];
    let wall_top: Matter.Body | undefined = undefined;
    let wall_bottom: Matter.Body | undefined = undefined;
    let wall_left: Matter.Body | undefined = undefined;
    let wall_right: Matter.Body | undefined = undefined;
    let bodiesInitialized = false;

    export let hyperWindows: HyperWindow[];

    //~ copied from elsewhere
    let scene: Scene;
    let canvasWidth = 800; //~ binding these upwards with useThrelte
    let canvasHeight = 600;
    let boundingSpheres: BoundingSphere[] = []; //~ bound to Scene, returns bounding spheres
    let debugPositions: [Vector2, string][] = []; //~ for now used for screen space positions of model spheres
    let debugTexts: { text: string; x: number; y: number }[] = [];
    let camera: PerspectiveCamera;
    let showMatterDebug: boolean = false;
    let matterjsDebugCanvas: HTMLCanvasElement | undefined = undefined;

    $: sizeChanged($size);
    const { renderer, size } = useThrelte();
    const canvas = renderer?.domElement;
    let previousCanvasWidth = 123;
    let previousCanvasHeight = 123;

    const sizeChanged = (size: Size) => {
        previousCanvasWidth = canvasWidth;
        previousCanvasHeight = canvasHeight;
        canvasWidth = size.width;
        canvasHeight = size.height;

        if ((previousCanvasWidth == 0 || previousCanvasHeight == 0) && canvasWidth != 0 && canvasHeight != 0) {
            if (!bodiesInitialized) {
                initializePhysicsBodies();
                bodiesInitialized = true;
            }
        }

        reconfigureWalls(canvasWidth, canvasHeight);
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
            context.clearRect(0, 0, canvas.width, canvas.height);
            matterjsDebugCanvas.style.background = "none";
        }
    };

    const initMatterDebugView = () => {
        if (matterRender != undefined) return;

        // create a renderer
        matterRender = Matter.Render.create({
            canvas: matterjsDebugCanvas,
            engine: engine,
            options: { width: canvasWidth, height: canvasHeight },
        });
    };
    
    const initializePhysicsBodies = () => {
        //~ creating the bodies here
        let bodies = [];
        let ids = [];
        for (let [i, hw] of hyperWindows.entries()) {
            //~ <0, 1> -> <0, width/height>
            const c = new Vector2(hw.screenPosition.x * canvasWidth, hw.screenPosition.y * canvasHeight);
            const newBody = Matter.Bodies.circle(c.x, c.y, hw.currentRadius, {
                restitution: 0,
                friction: 1,
            });
            hw.associatedBodyId = newBody.id;
            hw.associatedBodyIndex = i; //~ one of these is redundant but i can't say which rn
            bodies.push(newBody);
            ids.push(newBody.id);
        }
        matter_bodies = bodies;
        matter_body_ids = ids;

        //~ add bodies to the Matterjs engine's world
        Matter.Composite.add(engine.world, bodies);
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
        if (wall_top != undefined && wall_bottom != undefined && wall_left != undefined && wall_right != undefined) {
            Matter.Composite.remove(engine.world, [wall_top, wall_bottom, wall_left, wall_right]);
        }

        wall_bottom = ground;
        wall_top = topWall;
        wall_left = leftWall;
        wall_right = rightWall;

        // add all of the bodies to the world
        Matter.Composite.add(engine.world, [ground, leftWall, rightWall, topWall]);
    };

    export const newHyperWindowAdded = (newHW: HyperWindow, sourceHW: HyperWindow) => {
        ////~ TODO: I think this is the part that needs to be reworked the most, so I'm commenting it out for now
        // const startWorlPosition = camera ? unprojectToWorldSpace(newHW.screenPosition, camera) : new Vector3(0, 0, 0);
        // newHW.model.modelWorldPosition = startWorlPosition;
        //
        // const [_, radius] = computeBoundingSphere(newHW, camera);
        // newHW.currentRadius = radius;
        //
        // // broken code follows:
        // const c = new Vector2(newHW.screenPosition.x * canvasWidth, newHW.screenPosition.y * canvasHeight);
        // // const newBody = Matter.Bodies.circle(c.x, c.y, initialRadius, {
        // const newBody = Matter.Bodies.circle(c.x, c.y, newHW.currentRadius, {
        //     restitution: 0,
        //     friction: 1,
        // });
        // newHW.associatedBodyId = newBody.id;
        // newHW.associatedBodyIndex = matter_bodies.length;
        // // (hw.associatedBodyIndex = i), //~ one of these is redundant but i can't say which rn
        // matter_bodies.push(newBody);
        // matter_body_ids.push(newBody.id);
        // // i += 1;
        //
        // // matter_bodies = bodies;
        // // matter_body_ids = ids;
        //
        // const sourceHWBody = matter_bodies[sourceHW.associatedBodyIndex];
        // var constraint = Matter.Constraint.create({
        //     bodyA: sourceHWBody,
        //     bodyB: newBody,
        //     stiffness: 0.001,
        //     damping: 0.05,
        // });
        //
        // //~ add bodies to the Matterjs engine's world
        // Matter.Composite.add(engine.world, [newBody, constraint]);
        // console.log("new selection -> new hyperwindow added -> should add new body!");
        //
        // // hyperWindows.push(newHW); //~ just temporarily, until next "update"
        // // recomputeBoundingSpheres(hyperWindows);
    };

    useFrame(() => {
        // recomputeBoundingSpheres();

        //~ debug
        // debugPositions = [];
        // for (let hw of hyperWindows) {
        //     const ss = projectPoint(hw.model.modelWorldPosition, camera);
        //     debugPositions.push([new Vector2(ss.x * canvasWidth, ss.y * canvasHeight), "#990000"]);
        // }

        /**
         * Updating HyperWindows positions based on the physics.
         * The bounding circles are going to adjust based on the physics,
         * and here we want to synchronize those.
         */
        const newHyperWindows: HyperWindow[] = [];
        for (const [i, b] of matter_bodies.entries()) {
            const oldHW = hyperWindows[i];

             const newScreenPosition = new Vector2(b.position.x / canvasWidth, b.position.y / canvasHeight);

             /**
              * I think this is where the problem is:
              * The hwNewWorldPosition is !not! the model origin, it's the position of center of the bounding circle
              */
             const hwNewWorldPosition = unprojectToWorldSpace(newScreenPosition, camera);
             const hwOldWorldPosition = unprojectToWorldSpace(oldHW.screenPosition, camera);
             const offset = hwNewWorldPosition.clone().sub(hwOldWorldPosition);

             const newModelWorldPosition = oldHW.model.modelWorldPosition.clone().add(offset);

            // spread operator
            newHyperWindows.push({
                ...oldHW,
                screenPosition: newScreenPosition,
                model: {
                    ...oldHW.model,
                    modelWorldPosition: newModelWorldPosition,
                },
                threeDView: {
                    ...oldHW.threeDView,
                },
            });
        }

        hyperWindows = newHyperWindows;
    });

    onMount(() => {
        engine.gravity.y = 0;
        var runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        initMatterDebugView();

        if (canvasWidth != 0 && canvasHeight != 0) {
            initializePhysicsBodies();
            bodiesInitialized = true;
        }

        console.log("LayoutOptimizer::onMount");

    });
</script>

<!--
@component
The purpose of LayoutOptimizer is to manage all the Matter.js logic behind placing HyperWindows around the canvas.

-->
<Scene
    {hyperWindows}
    {engine}
    {canvas}
    bind:this={scene}
    bind:canvasWidth
    bind:canvasHeight
    bind:boundingSpheres
    bind:debugTexts
    bind:camera
/>
<!-- TODO: probably also move the Selections layer here, I will need to send the HW positions also there-->
