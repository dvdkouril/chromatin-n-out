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
        computeTubes,
        getRandomInt,
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
    let mouseConstraint = null;

    //~ Threlte lifecycle
    const { renderer } = useThrelte();

    //~ DOM
    export let parentElement;
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
    export let boundingSphere_Center;
    export let boundingSphere_Radius;

    const onMouseDown = (e) => {
        dragging = true;

        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        lastMousePos = { x: x, y: y };
        console.log("mouse down!");

        //~ debuggggg
        console.log(engine.world.bodies);
    };

    const onMouseUp = (e) => {
        dragging = false;
        console.log("mouse up!");
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

            // console.log(hprWindow);
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
            Matter.Body.scale(b, 1.01, 1.01);

            //~ fetch hyperwindow associated with this body
            let hprWindow = models[0];
            for (let m of models) {
                if (m.associatedBodyId == bodyId) {
                    hprWindow = m;
                }
            }

            console.log("changing zoom");
            const zoomingSpeed = 0.001;
            hprWindow.model.zoom += zoomingSpeed * e.deltaY;
        }
    };

    const onClickTest = (event) => {
        console.log("CLICK");

        console.log("BOUNDING SPHERE TESTS");
        const positions = spheres.map((pos) => {
            return new Vector3(pos.x, pos.y, pos.z);
        });

        // just checking...bounding box
        let [bbMin, bbMax] = computeBoundingBox3D(positions);
        const diag = bbMax.sub(bbMin).length();
        console.log("BB in 3D");
        console.log("bbMin: " + bbMin.x + ", " + bbMin.y + ", " + bbMin.z);
        console.log("bbMax: " + bbMax.x + ", " + bbMax.y + ", " + bbMax.z);
        console.log("diagonal: " + diag);

        computeBoundingSphere(positions);
    };

    const generateStartingPositions = (
        n: number
    ): [{ x: number; y: number; r: number }[], number[]] => {
        let positions: { x: number; y: number; r: number }[] = [];
        let ids: number[] = [];

        const width = 800;
        const height = 600;
        for (let i = 0; i < n; i++) {
            const xPos = getRandomInt(width);
            const yPos = getRandomInt(height);
            const radius = 100;
            positions.push({ x: xPos, y: yPos, r: radius });
        }

        let bodies = [];
        for (let c of positions) {
            const newBody = Matter.Bodies.circle(c.x, c.y, c.r, {
                restitution: 0,
                friction: 1,
            });
            bodies.push(newBody);
            ids.push(newBody.id);
        }

        Matter.Composite.add(engine.world, bodies);

        // return positions;
        return [positions, ids];
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

        // create a renderer
        let render = Matter.Render.create({
            element: parentElement,
            engine: engine,
        });

        var ground = Matter.Bodies.rectangle(400, 610, 810, 60, {
            isStatic: true,
        });
        var leftWall = Matter.Bodies.rectangle(0, 0, 10, 1200, {
            isStatic: true,
        });
        var rightWall = Matter.Bodies.rectangle(800, 0, 10, 1200, {
            isStatic: true,
        });
        var topWall = Matter.Bodies.rectangle(400, 10, 1200, 60, {
            isStatic: true,
        });

        // engine.gravity.y *= 0.1;
        engine.gravity.y = 0;

        // add all of the bodies to the world
        Matter.Composite.add(engine.world, [
            ground,
            leftWall,
            rightWall,
            topWall,
        ]);

        let mouse = Matter.Mouse.create(render.canvas);
        mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false },
            },
        });

        Matter.Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        Matter.Events.on(mouseConstraint, "mousedown", onClickTest);

        Matter.Render.run(render);
        var runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        // let [screenPositions, ids] = generateStartingPositions(5);
        let [screenPositions, ids] = generateStartingPositions(1);

        let i = 0;
        for (const p of screenPositions) {
            const uv = new Vector2(p.x / 800, p.y / 600);
            models.push({
                screenPosition: new Vector2(uv.x, uv.y),
                associatedBodyId: ids[i],
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

    const projectPositions = (points: Vector3[]): Vector2[] => {
        const newPoints: Vector2[] = [];

        for (let p of points) {
            let cp = new Vector3(p.x, p.y, p.z);
            let projectedP = cp.project(camera);
            projectedP.divideScalar(2);
            projectedP.addScalar(0.5);
            newPoints.push(new Vector2(projectedP.x * 800, projectedP.y * 600));
        }

        return newPoints;
    };

    const computeBoundingCircle = (points: Vector2[]): [Vector2, number] => {
        //~ 1. find two points that are far away
        let a = points[0];
        let b = points[1];

        console.log("BOUNDING CIRCLE computation:");

        const getDist = (p: Vector2, v: Vector2): number => {
            return p.distanceTo(v);
        };

        for (let p of points) {
            const d = getDist(a, p);
            if (d > getDist(a, b)) {
                b = p;
            }
        }

        //~ 2. initial estimation
        let bsCenter = b.clone().sub(a).divideScalar(2.0);
        let bsRadius = bsCenter.length();

        //~ 3. adjust the estimation
        for (let p of points) {
            const v = p.clone().sub(bsCenter);
            const d = v.length();

            if (d > bsRadius) {
                //~ outside of the bounding sphere

                let difference = d - bsRadius;
                let newDiameter = 2 * bsRadius + difference;
                let newRadius = newDiameter / 2.0;
                v.normalize();
                let newCenter = bsCenter
                    .clone()
                    .add(v.multiplyScalar(difference / 2.0));

                bsCenter = newCenter;
                bsRadius = newRadius;
            }
        }

        return [bsCenter, bsRadius];
    };

    /**
     *
     * @param pointsIn3D an array of points in 3D which will be projected into 2D and then the computation of a bounding sphere bounding "circle"
     * returns a 2D position and a radius of the bounding circle
     */
    const computeBoundingSphere = (
        pointsIn3D: Vector3[]
    ): [Vector2, number] => {
        //~ 1. project points into screen space
        const pointsIn2D = projectPositions(pointsIn3D);

        //~ 2. Ritter's bounding sphere algorithm (in 2D)
        const bSphere = computeBoundingCircle(pointsIn2D);

        boundingSphere_Center = bSphere[0];
        boundingSphere_Radius = bSphere[1];

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
                const width = 800;
                const height = 600;
                newModels.push({
                    screenPosition: new Vector2(
                        b.position.x / width,
                        b.position.y / height
                    ),
                    model: oldModel.model,
                    associatedBodyId: oldModel.associatedBodyId,
                });
                i += 1;
            }
        }
        models = newModels;

        //~ debug
        const positions = spheres.map((pos) => {
            return new Vector3(pos.x, pos.y, pos.z);
        });
        // computeBoundingSphere()
        computeBoundingSphere(positions);
    });
</script>

<T.PerspectiveCamera
    bind:ref={camera}
    makeDefault
    position={[0, 0, 50]}
    fov={24}
>
    <!-- <OrbitControls enableDamping /> -->
</T.PerspectiveCamera>

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
