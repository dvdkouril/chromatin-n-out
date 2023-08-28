<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import type { vec3 } from "gl-matrix";
    import {
        recenter,
        computeTubes,
        getRandomInt,
        unprojectToWorldSpace,
    } from "../util";
    import {
        Vector3,
        Vector2,
        BoxGeometry,
        MeshStandardMaterial,
        PerspectiveCamera,
    } from "three";
    import { brafl } from "../test_BRAFL";
    import { onMount } from "svelte";
    import { parsePdb } from "../pdb";
    import Scene from "../components/Scene.svelte";
    import * as Matter from "matter-js";

    let Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Body = Matter.Body,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        Mouse = Matter.Mouse,
        MouseConstraint = Matter.MouseConstraint,
        Events = Matter.Events;

    // create an engine
    let engine = Engine.create();

    let parentElement = null;
    let mouseConstraint = null;

    let width = 800;
    let height = 600;

    const scale = 0.02;
    const sphereRadius = 0.1;
    const tubeBaseSize = 0.05;

    let camera: PerspectiveCamera;

    let selections = [];
    let hoveredBin = null;
    let bins = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
    ];

    export let spheres = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
    ];
    $: tubes = computeTubes(spheres);

    let models = [];

    const getSelectionOrBaseColor = (sels, binId: number) => {
        for (let sel of sels) {
            if (binId == hoveredBin) {
                return "red";
            }
            if (binId <= sel.end && binId >= sel.start) {
                return sel.color;
            }
        }
        return "#aaaaaa";
    };

    const getWorldPositionFromScreenCoordinates = (coordinates: Vector2) => {
        console.log(camera.projectionMatrix);
    };

    const onclickTest = (e) => {
        console.log("canvas click");
        console.log(camera.projectionMatrix);
    };

    const onClickTest = (event) => {
        console.log("CLICK");
        console.log(mouseConstraint ? mouseConstraint.body : "no");
        console.log(event);
        if (mouseConstraint && mouseConstraint.body) {
            const body = mouseConstraint.body;

            if (event.mouse.button == 0) {
                Body.scale(body, 1.2, 1.2);
                // } else if (event.mouse.button == 2 ) {
            } else {
                Body.scale(body, 0.8, 0.8); // yeah, not inverse operation...but whatever for now
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
            bodies.push(Bodies.circle(c.x, c.y, c.r));
        }

        Composite.add(engine.world, bodies);

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
        let render = Render.create({
            element: parentElement,
            engine: engine,
        });

        var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
        var leftWall = Bodies.rectangle(0, 0, 10, 1200, { isStatic: true });
        var rightWall = Bodies.rectangle(800, 0, 10, 1200, { isStatic: true });
        var topWall = Bodies.rectangle(400, 10, 1200, 60, { isStatic: true });

        // engine.gravity.y *= 0.1;
        engine.gravity.y = 0;

        // add all of the bodies to the world
        Composite.add(engine.world, [ground, leftWall, rightWall, topWall]);

        let mouse = Mouse.create(render.canvas);
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false },
            },
        });

        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        Events.on(mouseConstraint, "mousedown", onClickTest);
        // run the renderer
        Render.run(render);

        // create runner
        var runner = Runner.create();

        // run the engine
        Runner.run(runner, engine);

        // generateStartingPositions(25);
        let screenPositions = generateStartingPositions(5);

        for (const p of screenPositions) {
            const uv = new Vector2(p.x / 800, p.y / 600);
            models.push({
                screenPosition: new Vector2(uv.x, uv.y),
                spheres: spheres,
                tubes: tubesLocal,
            });
        }
    
    });
</script>

<div>Big canvas!</div>
<button on:click={onclickTest}>debug</button>
<Canvas size={{ width: width, height: height }}>
    <Scene bind:camera {models} />
</Canvas>

<div bind:this={parentElement}></div>
