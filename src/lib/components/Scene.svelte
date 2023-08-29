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
        computeTubes,
        getRandomInt,
        recenter,
        unprojectToWorldSpace,
    } from "../util";
    import type { HyperWindow } from "../hyperwindows-types";
    import * as Matter from "matter-js";
    import { parsePdb } from "../pdb";
    import { brafl } from "../test_BRAFL";
    import type { vec3 } from "gl-matrix";

    // create an engine
    let engine = Matter.Engine.create();

    export let parentElement;

    const { renderer } = useThrelte();
    const canvas = renderer?.domElement;

    // const { world } = useRapier();
    // const noGravity = () => (world.gravity = { x: 0, y: 0, z: 0 });

    let debugPos_ObjectSpace = new Vector3(0, 0, 0);

    export let spheres = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
    ];

    let models: HyperWindow[] = [];

    const scale = 0.02;

    let mouseConstraint = null;
    let camera: PerspectiveCamera;

    const onMouseMove = (e) => {
        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        let canvasWidth = rect.width;
        let canvasHeight = rect.height;

        debugPos_ObjectSpace = unprojectToWorldSpace(
            new Vector2(x / canvasWidth, y / canvasHeight),
            camera
        );
    };
    const onClickTest = (event) => {
        console.log("CLICK");
        console.log(mouseConstraint ? mouseConstraint.body : "no");
        console.log(event);
        if (mouseConstraint && mouseConstraint.body) {
            const body = mouseConstraint.body;

            if (event.mouse.button == 0) {
                Matter.Body.scale(body, 1.2, 1.2);
                // } else if (event.mouse.button == 2 ) {
            } else {
                Matter.Body.scale(body, 0.8, 0.8); // yeah, not inverse operation...but whatever for now
            }
        }
    };
    const generateStartingPositions = (
        n: number
    ): { x: number; y: number; r: number }[] => {
        let positions: { x: number; y: number; r: number }[] = [];
        const width = 800;
        const height = 600;
        for (let i = 0; i < n; i++) {
            const xPos = getRandomInt(width);
            const yPos = getRandomInt(height);
            const radius = getRandomInt(100);
            positions.push({ x: xPos, y: yPos, r: radius });
        }

        let bodies = [];
        for (let c of positions) {
            bodies.push(Matter.Bodies.circle(c.x, c.y, c.r));
        }

        Matter.Composite.add(engine.world, bodies);

        return positions;
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

        let screenPositions = generateStartingPositions(5);

        for (const p of screenPositions) {
            const uv = new Vector2(p.x / 800, p.y / 600);
            models.push({
                screenPosition: new Vector2(uv.x, uv.y),
                model: {
                    spheres: spheres,
                    tubes: tubesLocal,
                },
            });
        }

        // noGravity();
        canvas.addEventListener("mousemove", onMouseMove);
    });

    useFrame(() => {
        console.log("test");
        console.log(engine.world.bodies);
        const newModels = [];
        let i = 0;
        for (let b of engine.world.bodies) {
            if (b.label == "Circle Body") {
                console.log("circle");
                const oldModel = models[i];
                newModels.push({
                    screenPosition: b.position,
                    ...oldModel,
                })
                i += 1;
            }
        }
        // models = newModels;
    });
</script>

<T.PerspectiveCamera
    bind:ref={camera}
    makeDefault
    position={[0, 0, 50]}
    fov={24}
>
    <OrbitControls enableDamping />
</T.PerspectiveCamera>

<T.DirectionalLight castShadow position={[3, 10, 10]} />
<T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
<T.AmbientLight intensity={0.2} />

<!-- DEBUG cube under cursor -->
<T.Group
    position={[
        debugPos_ObjectSpace.x,
        debugPos_ObjectSpace.y,
        debugPos_ObjectSpace.z,
    ]}
>
    <T.Mesh
        receiveShadow
        geometry={new BoxGeometry(1, 1, 1)}
        material={new MeshStandardMaterial()}
    />
</T.Group>

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
