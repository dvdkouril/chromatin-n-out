<script lang="ts">
    import * as Matter from "matter-js";
    import { onMount } from "svelte";
    import { getRandomInt } from "../../util";

    // module aliases
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

    $: selectedBubble = mouseConstraint ? mouseConstraint.body : null;
    // $: selectedBubble = mouseConstraint.body;
    $: console.log(mouseConstraint);
    $: console.log("TST");
    // $: console.log(mouseConstraint ? mouseConstraint.body : "nothing");
    // $: console.log(mouseConstraint ? mouseConstraint.mouse.absolute.x : "nothing");

    const generateStartingPositions = (n: number) => {
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
    };

    onMount(() => {
        // create a renderer
        let render = Render.create({
            // element: document.body,
            element: parentElement,
            engine: engine,
        });

        // create two boxes and a ground
        // var boxA = Bodies.rectangle(400, 200, 80, 80);
        // var boxB = Bodies.rectangle(450, 50, 80, 80);
        // var sphereA = Bodies.circle(200, 200, 50);
        // var sphereB = Bodies.circle(300, 200, 50);
        // var sphereC = Bodies.circle(400, 200, 50);
        // var sphereD = Bodies.circle(500, 200, 50);
        var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
        var leftWall = Bodies.rectangle(0, 0, 10, 1200, { isStatic: true });
        var rightWall = Bodies.rectangle(800, 0, 10, 1200, { isStatic: true });
        var topWall = Bodies.rectangle(400, 10, 1200, 60, { isStatic: true });

        // engine.gravity.y *= 0.1;
        engine.gravity.y = 0;

        // add all of the bodies to the world
        Composite.add(engine.world, [
            // sphereA,
            // sphereB,
            // sphereC,
            // sphereD,
            // boxA,
            // boxB,
            ground,
            leftWall,
            rightWall,
            topWall,
        ]);

        //     var mouse = Mouse.create(render.canvas),
        //     mouseConstraint = MouseConstraint.create(engine, {
        //         mouse: mouse,
        //         constraint: {
        //             stiffness: 0.2,
        //             render: {
        //                 visible: false
        //             }
        //         }
        //     });

        // Composite.add(world, mouseConstraint);

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

        generateStartingPositions(25);
    });

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
</script>

<div bind:this={parentElement}>Bubbles!!!</div>
<div>selected: {mouseConstraint ? mouseConstraint.body : ""}</div>
