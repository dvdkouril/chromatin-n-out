<script lang="ts">
    import { T, useFrame } from "@threlte/core";
    import ModelPartWithInstancing from "./ModelPartWithInstancing.svelte";
    import {
        BoxGeometry,
        MeshStandardMaterial,
        PerspectiveCamera,
        Vector2,
        Vector3,
    } from "three";
    import { onMount } from "svelte";
    import { useThrelte } from "@threlte/core";
    import {
        computeBoundingCircle,
        projectModel,
        unprojectToWorldSpace,
    } from "../../../util";
    import type {
        BoundingSphere,
        HyperWindow,
    } from "../../../hyperwindows-types";
    import * as Matter from "matter-js";

    //~ Matter.js physics
    let engine = Matter.Engine.create();
    let matter_bodies = [];
    let matter_body_ids = [];

    //~ Threlte lifecycle
    const { renderer, size } = useThrelte();

    //~ DOM
    const canvas = renderer?.domElement;
    let lastMousePos = { x: 0, y: 0 };
    let dragging = false;
    $: sizeChanged($size);
    export let canvasWidth = 123;
    export let canvasHeight = 123;

    //~ Actual scene content
    export let hyperWindows: HyperWindow[];
    let camera: PerspectiveCamera;

    //~ exports
    export let boundingSpheres: BoundingSphere[]; //~ sending up the computed bounding spheres (center+radius)
    export let debugPositions: Vector2[]; //~ sending up just the projected bin positions

    const sizeChanged = (size) => {
        canvasWidth = size.width;
        canvasHeight = size.height;
    };

    const onMouseDown = (e) => {
        dragging = true;

        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        lastMousePos = { x: x, y: y };
    };

    const onMouseUp = (e) => {
        dragging = false;
    };

    /**
     * Local orbiting (ray casting the associated Matterjs body)
     * @param e
     */
    const onMouseMove = (e) => {
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
        }
    };

    /**
     * Local zooming
     * @param e
     */
    const onWheel = (e) => {
        //~ disable scrolling the page with mouse wheel
        e.preventDefault();
        e.stopPropagation();

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

            // console.log("changing zoom");
            const zoomingSpeed = 0.001;
            hprWindow.threeDView.zoom += zoomingSpeed * e.deltaY;
        }
    };

    export const newHyperWindowAdded = (newHW: HyperWindow) => {
        // broken code follows:
        const c = new Vector2(
            newHW.screenPosition.x * canvasWidth,
            newHW.screenPosition.y * canvasHeight
        );
        // const newBody = Matter.Bodies.circle(c.x, c.y, initialRadius, {
        const newBody = Matter.Bodies.circle(c.x, c.y, 100, {
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
    };

    onMount(() => {
        engine.gravity.y = 0;
        var runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        //~ creating the bodies here
        let bodies = [];
        let ids = [];
        const initialRadius = 100;
        let i = 0;
        for (let hw of hyperWindows) {
            const c = new Vector2(
                hw.screenPosition.x * canvasWidth,
                hw.screenPosition.y * canvasHeight
            );
            const newBody = Matter.Bodies.circle(c.x, c.y, initialRadius, {
                restitution: 0,
                friction: 1,
            });
            hw.associatedBodyId = newBody.id;
            (hw.associatedBodyIndex = i), //~ one of these is redundant but i can't say which rn
                bodies.push(newBody);
            ids.push(newBody.id);
            i += 1;
        }
        matter_bodies = bodies;
        matter_body_ids = ids;

        //~ add bodies to the Matterjs engine's world
        Matter.Composite.add(engine.world, bodies);

        //~ register events
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("wheel", onWheel);
    });

    const projectModelToScreenSpace = (
        hyperwindow: HyperWindow,
        camera: PerspectiveCamera
    ): Vector2[] => {
        const pointsIn2D = projectModel(hyperwindow, camera);

        //~ transform from <0,1> to <0,width/height>
        const newPoints = pointsIn2D.map((p: Vector2): Vector2 => {
            return new Vector2(p.x * canvasWidth, p.y * canvasHeight);
        });

        return newPoints;
    };

    /**
     *
     * @param pointsIn3D an array of points in 3D which will be projected into 2D and then the computation of a bounding sphere bounding "circle"
     * returns a 2D position and a radius of the bounding circle
     */
    const computeBoundingSphere = (
        hyperwindow: HyperWindow
    ): [Vector2, number] => {
        //~ 1. project points into screen space
        const pointsIn2D = projectModelToScreenSpace(hyperwindow, camera);
        //DEBUG
        debugPositions = debugPositions.concat(pointsIn2D);

        //~ 2. Ritter's bounding sphere algorithm (in 2D)
        const bSphere = computeBoundingCircle(pointsIn2D);

        return bSphere;
    };

    useFrame(() => {
        const newHyperWindows: HyperWindow[] = [];
        for (const [i, b] of matter_bodies.entries()) {
            const oldHW = hyperWindows[i];

            const newScreenPosition = new Vector2(
                b.position.x / canvasWidth,
                b.position.y / canvasHeight
            );

            // spread operator
            newHyperWindows.push({
                ...oldHW,
                screenPosition: newScreenPosition,
                threeDView: {
                    ...oldHW.threeDView,
                    worldPosition: camera
                        ? unprojectToWorldSpace(newScreenPosition, camera)
                        : new Vector3(0, 0, 0),
                },
            });
        }

        hyperWindows = newHyperWindows;

        debugPositions = [];
        boundingSpheres = [];
        for (let hw of hyperWindows) {
            let [center, radius] = computeBoundingSphere(hw);
            boundingSpheres.push({ center: center, radius: radius });
        }
        boundingSpheres = boundingSpheres;

        //~ update bodies
        for (let hw of hyperWindows) {
            let body = matter_bodies[hw.associatedBodyIndex];

            const currentRadius = hw.currentRadius;
            const wantedRadius = boundingSpheres[hw.associatedBodyIndex].radius;
            const scaleFactor = wantedRadius / currentRadius; //~ or is it the other way around?
            hw.currentRadius = wantedRadius;

            Matter.Body.scale(body, scaleFactor, scaleFactor);
        }
    });
</script>

<T.PerspectiveCamera
    bind:ref={camera}
    makeDefault
    position={[0, 0, 50]}
    fov={24}
/>

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
