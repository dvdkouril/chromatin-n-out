<script lang="ts">
    import { T, useFrame, type Size } from "@threlte/core";
    import ModelPartWithInstancing from "./ModelPartWithInstancing.svelte";
    import { BoxGeometry, MeshStandardMaterial, PerspectiveCamera, Vector2, Vector3 } from "three";
    import { onMount } from "svelte";
    import { useThrelte } from "@threlte/core";
    import { computeBoundingCircle, projectModelToScreenSpace, projectPoint, unprojectToWorldSpace } from "../../util";
    import type { BoundingSphere, HyperWindow } from "../../hyperwindows-types";
    import * as Matter from "matter-js";

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

    //~ Threlte lifecycle
    const { renderer, size } = useThrelte();

    //~ DOM
    const canvas = renderer?.domElement;
    let lastMousePos = { x: 0, y: 0 };
    let dragging = false;
    $: sizeChanged($size);
    export let canvasWidth = 123;
    export let canvasHeight = 123;
    let previousCanvasWidth = 123;
    let previousCanvasHeight = 123;
    export let matterjsDebugCanvas: HTMLCanvasElement;

    //~ Actual scene content
    export let hyperWindows: HyperWindow[];
    export let camera: PerspectiveCamera;

    //~ exports
    export let boundingSpheres: BoundingSphere[]; //~ sending up the computed bounding spheres (center+radius)
    export let debugPositions: [Vector2, string][]; //~ sending up just the projected bin positions
    export let debugTexts: { text: string; x: number; y: number }[];
    export let showMatterDebug: boolean;

    $: toggleMatterDebugView(showMatterDebug);

    const toggleMatterDebugView = (show: boolean) => {
        console.log("Toggled Matter debug view.");
        if (show == true) {
            // create a renderer
            // let render = Matter.Render.create({
            matterRender = Matter.Render.create({
                // element: parentElement,
                // element: matterjsDebugCanvas,
                canvas: matterjsDebugCanvas,
                engine: engine,
                options: { width: canvasWidth, height: canvasHeight },
            });

            Matter.Render.run(matterRender);
        } else {
            if (matterRender == undefined) {
                return;
            }
            console.log("stopping matter render");
            Matter.Render.stop(matterRender);
            const context = matterjsDebugCanvas.getContext("2d");
            if (context == null) {
                return;
            }
            context.clearRect(0, 0, canvas.width, canvas.height);
            matterjsDebugCanvas.style.background = "none";
        }
    };

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

    const onMouseDown = (e: MouseEvent) => {
        if (e.target == null) {
            return; 
        }
        if (!(e.target instanceof Element)) {
            return;
        }
        dragging = true;

        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        lastMousePos = { x: x, y: y };
    };

    const onMouseUp = (e: MouseEvent) => {
        dragging = false;
    };

    /**
     * Local orbiting (ray casting the associated Matterjs body)
     * @param e
     */
    const onMouseMove = (e: MouseEvent) => {
        if (e.target == null) {
            return; 
        }
        if (!(e.target instanceof Element)) {
            return;
        }
        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        if (!dragging) {
            return;
        }

        //~ use the x,y to query the physics engine; get the body under cursor
        let hitBodies = Matter.Query.point(engine.world.bodies, { x: x, y: y });
        if (hitBodies.length > 0) {
            let b = hitBodies[0]; //~ assume for now that we don't have overlapping bodies
            const bodyId = b.id;

            //TODO: better way to fetch hyperwindow associated with this body? (probably need some map structure)
            let hprWindow = hyperWindows[0]; // just for testing
            for (let hw of hyperWindows) {
                if (hw.associatedBodyId == bodyId) {
                    hprWindow = hw;
                }
            }

            const deltaX = x - lastMousePos.x;
            const deltaY = y - lastMousePos.y;
            const orbitingSpeed = 0.8;
            hprWindow.threeDView.rotationX += orbitingSpeed * deltaX;
            hprWindow.threeDView.rotationY += orbitingSpeed * deltaY;

            lastMousePos = { x: x, y: y };

            //~ adjust Matter.js body: Scale
            let [center, radius] = computeBoundingSphere(hprWindow);
            const currentRadius = hprWindow.currentRadius;
            const wantedRadius = radius;
            const scaleFactor = wantedRadius / currentRadius;
            hprWindow.currentRadius = wantedRadius;

            Matter.Body.scale(b, scaleFactor, scaleFactor);

            //~ adjust Matter.js body:  Position
            const wantedPos = center;
            const currentPos = new Vector2(b.position.x, b.position.y);
            const offset = wantedPos.clone().sub(currentPos);

            // Matter.Body.translate(b, { x: offset.x, y: offset.y });

            recomputeBoundingSpheres(); //~ TODO: I guess it's unnecessary to compute BS twice
        }
    };

    /**
     * Local zooming
     * @param e
     */
    const onWheel = (e: WheelEvent) => {
        //~ disable scrolling the page with mouse wheel
        e.preventDefault();
        e.stopPropagation();

        if (e.target == null) {
            return;
        }

        if (!(e.target instanceof Element)) {
            return;
        }

        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        //~ use the x,y to query the physics engine; get the body under cursor
        let hitBodies = Matter.Query.point(engine.world.bodies, { x: x, y: y });
        if (hitBodies.length > 0) {
            let b = hitBodies[0]; //~ assume for now that we don't have overlapping bodies
            const bodyId = b.id;

            //~ fetch hyperwindow associated with this body
            let hprWindow = hyperWindows[0];
            for (let hw of hyperWindows) {
                if (hw.associatedBodyId == bodyId) {
                    hprWindow = hw;
                }
            }

            const zoomingSpeed = 0.001;
            hprWindow.threeDView.zoom += zoomingSpeed * e.deltaY;

            //~ adjust Matter.js body: Scale
            let [center, radius] = computeBoundingSphere(hprWindow);
            const currentRadius = hprWindow.currentRadius;
            const wantedRadius = radius;
            const scaleFactor = wantedRadius / currentRadius;
            hprWindow.currentRadius = wantedRadius;

            Matter.Body.scale(b, scaleFactor, scaleFactor);

            //~ adjust Matter.js body:  Position
            const wantedPos = center;
            const currentPos = new Vector2(b.position.x, b.position.y);
            const offset = wantedPos.clone().sub(currentPos);

            // Matter.Body.translate(b, { x: offset.x, y: offset.y });

            recomputeBoundingSpheres(); //~ TODO: I guess it's unnecessary to compute BS twice
        }
    };

    export const newHyperWindowAdded = (newHW: HyperWindow) => {
        const startWorlPosition = camera ? unprojectToWorldSpace(newHW.screenPosition, camera) : new Vector3(0, 0, 0);
        newHW.model.modelWorldPosition = startWorlPosition;

        const [center, radius] = computeBoundingSphere(newHW);
        newHW.currentRadius = radius;

        // broken code follows:
        const c = new Vector2(newHW.screenPosition.x * canvasWidth, newHW.screenPosition.y * canvasHeight);
        // const newBody = Matter.Bodies.circle(c.x, c.y, initialRadius, {
        const newBody = Matter.Bodies.circle(c.x, c.y, newHW.currentRadius, {
            restitution: 0,
            friction: 1,
        });
        newHW.associatedBodyId = newBody.id;
        newHW.associatedBodyIndex = matter_bodies.length;
        // (hw.associatedBodyIndex = i), //~ one of these is redundant but i can't say which rn
        matter_bodies.push(newBody);
        matter_body_ids.push(newBody.id);
        // i += 1;

        // matter_bodies = bodies;
        // matter_body_ids = ids;

        //~ add bodies to the Matterjs engine's world
        Matter.Composite.add(engine.world, [newBody]);
        console.log("new selection -> new hyperwindow added -> should add new body!");

        recomputeBoundingSpheres();
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

    onMount(() => {
        engine.gravity.y = 0;
        var runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        // //~ fix the model world position
        // for (let hw of hyperWindows) {
        //     const startWorlPosition = unprojectToWorldSpace(hw.screenPosition, camera);
        //     hw.model.modelWorldPosition = startWorlPosition;
        // }

        // for (let hw of hyperWindows) {
        //     const [center, radius] = computeBoundingSphere(hw);
        //     hw.currentRadius = radius;
        //     hw.screenPosition.x = center.x / canvasWidth;
        //     hw.screenPosition.y = center.y / canvasHeight;
        // }

        if (canvasWidth != 0 && canvasHeight != 0) {
            initializePhysicsBodies();
            bodiesInitialized = true;
        }

        //~ register events
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("wheel", onWheel);

        recomputeBoundingSpheres();
    });

    /**
     *
     * @param pointsIn3D an array of points in 3D which will be projected into 2D and then the computation of a bounding sphere bounding "circle"
     * returns a 2D position and a radius of the bounding circle
     */
    const computeBoundingSphere = (hyperwindow: HyperWindow): [Vector2, number] => {
        //~ 1. project points into screen space
        const pointsIn2D = projectModelToScreenSpace(hyperwindow, camera, canvasWidth, canvasHeight);
        //DEBUG
        // debugPositions = debugPositions.concat(pointsIn2D);

        //~ 2. Ritter's bounding sphere algorithm (in 2D)
        const bSphere = computeBoundingCircle(pointsIn2D);

        return bSphere;
    };

    const recomputeBoundingSpheres = () => {
        boundingSpheres = [];
        debugTexts = [];
        for (let hw of hyperWindows) {
            let [center, radius] = computeBoundingSphere(hw);
            boundingSpheres.push({ center: center, radius: radius });
            debugTexts.push({
                text: "[" + center.x + ", " + center.y + "]",
                x: center.x,
                y: center.y,
            });
        }
        boundingSpheres = boundingSpheres;
    };

    useFrame(() => {
        // recomputeBoundingSpheres();

        //~ debug
        debugPositions = [];
        for (let hw of hyperWindows) {
            const ss = projectPoint(hw.model.modelWorldPosition, camera);
            debugPositions.push([new Vector2(ss.x * canvasWidth, ss.y * canvasHeight), "#990000"]);
        }
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
</script>

<T.PerspectiveCamera bind:ref={camera} makeDefault position={[0, 0, 50]} fov={24} />

<T.DirectionalLight castShadow position={[3, 10, 10]} />
<T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
<T.AmbientLight intensity={0.2} />

{#each hyperWindows as hw}
    <ModelPartWithInstancing model={hw.model} viewParams={hw.threeDView} />
{/each}

<T.Group position={[0, -20, 0]}>
    <T.Mesh
        receiveShadow
        geometry={new BoxGeometry(50, 1, 50)}
        material={new MeshStandardMaterial()}
        on:click={() => {
            console.log("test test test");
        }}
    />
</T.Group>
