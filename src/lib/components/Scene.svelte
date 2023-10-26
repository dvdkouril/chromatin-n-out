<script lang="ts">
    import { T, useFrame } from "@threlte/core";
    import { OrbitControls } from "@threlte/extras";
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
        computeBoundingBox2D,
        computeBoundingBox3D,
        computeBoundingCircle,
        computeTubes,
        generateStartingPositions,
        getRandomInt,
        projectModel,
        recenter,
        unprojectToWorldSpace,
    } from "../util";
    import type { HyperWindow } from "../hyperwindows-types";
    import * as Matter from "matter-js";
    import { parsePdb } from "../pdb";
    import { brafl } from "../test_BRAFL";
    import type { vec2, vec3 } from "gl-matrix";

    //~ Matter.js physics
    let engine = Matter.Engine.create();
    // let mouseConstraint = null;
    let matter_bodies = [];
    let matter_body_ids = [];

    //~ Threlte lifecycle
    const { renderer, size } = useThrelte();

    //~ DOM
    const canvas = renderer?.domElement;
    let lastMousePos = { x: 0, y: 0 };
    let dragging = false;

    //~ Actual scene content
    let models: HyperWindow[] = [];
    let camera: PerspectiveCamera;
    //~ model
    export let spheres = [];
    const scale = 0.02;

    //~ exports
    export let boundingSpheres: { center: Vector2; radius: number }[];
    export let debugPositions: Vector2[];

    $: sizeChanged($size);
    export let canvasWidth = 123;
    export let canvasHeight = 123;

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
            // console.log("HIT SOME BODY!");
            let b = hitBodies[0]; //~ assume for now that we don't have overlapping bodies
            const bodyId = b.id;

            //TODO: fetch hyperwindow associated with this body (probably need some map structure)
            let hprWindow = models[0]; // just for testing
            for (let m of models) {
                if (m.associatedBodyId == bodyId) {
                    hprWindow = m;
                }
            }

            const deltaX = x - lastMousePos.x;
            const deltaY = y - lastMousePos.y;
            const orbitingSpeed = 0.8;
            hprWindow.model.rotationX += orbitingSpeed * deltaX;
            hprWindow.model.rotationY += orbitingSpeed * deltaY;

            lastMousePos = { x: x, y: y };
        }
    };

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
            let hprWindow = models[0];
            for (let m of models) {
                if (m.associatedBodyId == bodyId) {
                    hprWindow = m;
                }
            }

            // console.log("changing zoom");
            const zoomingSpeed = 0.001;
            hprWindow.model.zoom += zoomingSpeed * e.deltaY;
        }
    };

    onMount(() => {
        spheres = parsePdb(brafl).bins.map(({ x, y, z }) => ({
            // spheres = parsePdb(cell7).bins.map(({ x, y, z }) => ({
            x: x * scale,
            y: y * scale,
            z: z * scale,
        }));

        spheres = recenter(spheres).map((pos: vec3) => {
            return { x: pos[0], y: pos[1], z: pos[2] };
        });

        const tubesLocal = computeTubes(spheres);

        // // create a renderer
        // parentElement.innerHTML = '';
        // let render = Matter.Render.create({
        //     element: parentElement,
        //     engine: engine,
        // });

        // var ground = Matter.Bodies.rectangle(canvasWidth / 2, canvasHeight, canvasWidth, 60, {
        //     isStatic: true,
        // });
        // var leftWall = Matter.Bodies.rectangle(0, 0, 10, canvasHeight, {
        //     isStatic: true,
        // });
        // var rightWall = Matter.Bodies.rectangle(canvasWidth, 0, 10, canvasHeight, {
        //     isStatic: true,
        // });
        // var topWall = Matter.Bodies.rectangle(canvasWidth / 2, 10, canvasWidth, 60, {
        //     isStatic: true,
        // });

        // engine.gravity.y *= 0.1;
        engine.gravity.y = 0;

        // // add all of the bodies to the world
        // Matter.Composite.add(engine.world, [
        //     ground,
        //     leftWall,
        //     rightWall,
        //     topWall,
        // ]);

        var runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        let screenPositions = generateStartingPositions(
            5,
            canvasWidth,
            canvasHeight
        );

        const initialRadius = 100;

        //~ creating the bodies here
        let bodies = [];
        let ids = [];
        for (let c of screenPositions) {
            const newBody = Matter.Bodies.circle(c.x, c.y, initialRadius, {
                restitution: 0,
                friction: 1,
            });
            bodies.push(newBody);
            ids.push(newBody.id);
        }
        matter_bodies = bodies;
        matter_body_ids = ids;

        Matter.Composite.add(engine.world, bodies);

        //~ constraints
        let constraints = [];
        let j = 0;
        let lastBody = bodies[0];
        for (let b of bodies) {
            if (j == 0) {
                j += 1;
                continue;
            }

            var constraint = Matter.Constraint.create({
                bodyA: b,
                // pointA: { x: -10, y: -10 },
                bodyB: lastBody,
                // pointB: { x: -10, y: -10 },
                // stiffness: 0.001,
                // damping: 0.1,
            });
            constraints.push(constraint);
            j += 1;
            lastBody = b;
        }

        // Matter.Composite.add(engine.world, constraints);

        let i = 0;
        for (const p of screenPositions) {
            const uv = new Vector2(p.x / canvasWidth, p.y / canvasHeight);
            models.push({
                screenPosition: new Vector2(uv.x, uv.y),
                currentRadius: initialRadius,
                associatedBodyId: ids[i],
                associatedBodyIndex: i, //~ one of these is redundant but i can't say which rn
                model: {
                    spheres: spheres,
                    tubes: tubesLocal,
                    rotationX: 0,
                    rotationY: 0,
                    zoom: 1,
                },
            });
            i += 1;
        }

        // noGravity();
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("wheel", onWheel);
    });

    //~ TODO: this function doesn't need to exist, just call directly projectModel
    const projectModelToScreenSpace = (
        model: HyperWindow,
        camera: PerspectiveCamera
    ): Vector2[] => {
        const pointsIn2D = projectModel(model, camera);

        //~ transform from <0,1> to <0,width/height>
        const newPoints = pointsIn2D.map((p: Vector2): Vector2 => {
            return new Vector2(p.x * canvasWidth, p.y * canvasHeight);
        });

        // return pointsIn2D;
        return newPoints;
    };

    /**
     *
     * @param pointsIn3D an array of points in 3D which will be projected into 2D and then the computation of a bounding sphere bounding "circle"
     * returns a 2D position and a radius of the bounding circle
     */
    const computeBoundingSphere = (model: HyperWindow): [Vector2, number] => {
        //~ 1. project points into screen space
        const pointsIn2D = projectModelToScreenSpace(model, camera);
        //DEBUG
        debugPositions = debugPositions.concat(pointsIn2D);

        //~ 2. Ritter's bounding sphere algorithm (in 2D)
        const bSphere = computeBoundingCircle(pointsIn2D);

        return bSphere;
    };

    useFrame(() => {
        const newModels: HyperWindow[] = [];
        let i = 0;
        for (let b of engine.world.bodies) {
            if (b.label == "Circle Body") {
                const oldModel = models[i];
                // newModels.push({
                //     screenPosition: b.position.x,
                //     ...oldModel,
                // })
                const width = canvasWidth;
                const height = canvasHeight;
                newModels.push({
                    screenPosition: new Vector2(
                        b.position.x / width,
                        b.position.y / height
                    ),
                    currentRadius: oldModel.currentRadius,
                    model: oldModel.model,
                    associatedBodyId: oldModel.associatedBodyId,
                    associatedBodyIndex: oldModel.associatedBodyIndex,
                });
                i += 1;
            }
        }
        models = newModels;

        debugPositions = [];
        boundingSpheres = [];
        for (let model of models) {
            let [center, radius] = computeBoundingSphere(model);
            boundingSpheres.push({ center: center, radius: radius });
        }

        //~ update bodies
        for (let model of models) {
            let body = matter_bodies[model.associatedBodyIndex];

            const currentRadius = model.currentRadius;
            const wantedRadius =
                boundingSpheres[model.associatedBodyIndex].radius;
            const scaleFactor = wantedRadius / currentRadius; //~ or is it the other way around?
            model.currentRadius = wantedRadius;

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

{#each models as model}
    <!-- <ModelPart {model}/> -->
    <ModelPartWithInstancing {model} {camera} />
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
