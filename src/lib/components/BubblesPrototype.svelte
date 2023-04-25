<script lang="ts">
    import * as Matter from "matter-js";

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

// create an engine
var engine = Engine.create();

// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine
});

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80);
var boxB = Bodies.rectangle(450, 50, 80, 80);
var sphereA = Bodies.circle(200, 200, 50);
var sphereB = Bodies.circle(300, 200, 50);
var sphereC = Bodies.circle(400, 200, 50);
var sphereD = Bodies.circle(500, 200, 50);
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
var leftWall = Bodies.rectangle(0, 0, 10, 1200, {isStatic: true});
var rightWall = Bodies.rectangle(1600, 0, 10, 1200, {isStatic: true});

engine.gravity.y *= 0.1;

// add all of the bodies to the world
Composite.add(engine.world, [sphereA, sphereB, sphereC, sphereD, boxA, boxB, ground, leftWall, rightWall]);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);
</script>

<div>
    Bubbles!!!
</div>