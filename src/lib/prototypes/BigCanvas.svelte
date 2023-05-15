<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import { OrbitControls } from "@threlte/extras";
    import type { vec3 } from "gl-matrix";
    import { recenter, computeTubes } from "../util";
    import { Vector3, type Vector2, BoxGeometry, MeshStandardMaterial } from "three";
    import { brafl } from "../test_BRAFL";
    import { onMount } from "svelte";
    import { parsePdb } from "../pdb";
    import ModelPart from "../components/ModelPart.svelte";
    import ModelPartWithInstancing from "../components/ModelPartWithInstancing.svelte";
    import { Debug, World, Collider, AutoColliders } from "@threlte/rapier";
    // import { World } from "@threlte/rapier";

    let width = 1920;
    let height = 1080;

    const scale = 0.02;
    const sphereRadius = 0.1;
    const tubeBaseSize = 0.05;

    let camera;

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

        models.push({
            position: new Vector3(0, 0, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });

        models.push({
            position: new Vector3(10, 0, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });

        models.push({
            position: new Vector3(-10, 0, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });

        models.push({
            position: new Vector3(-10, 10, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });

        models.push({
            position: new Vector3(0, 10, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });

        models.push({
            position: new Vector3(10, 10, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });

        models.push({
            position: new Vector3(-10, -10, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });

        models.push({
            position: new Vector3(0, -10, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });

        models.push({
            position: new Vector3(10, -10, 0),
            spheres: spheres,
            tubes: tubesLocal,
        });
    });
</script>

<div>Big canvas!</div>
<button on:click={onclickTest}>debug</button>
<Canvas size={{ width: width, height: height }}>
    <World>
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

        {#each models as model}
            <!-- <ModelPart {model}/> -->
            <!-- <Collider shape={'cuboid'} args={[1, 1, 1]}/> -->
            <ModelPartWithInstancing {model} />
        {/each}

        <T.Group position={[0, -20, 0]}>
            <AutoColliders shape={'cuboid'}>
              <T.Mesh
                receiveShadow
                geometry={new BoxGeometry(50, 1, 50)}
                material={new MeshStandardMaterial()}
              />
            </AutoColliders>
          </T.Group>

        <Debug depthTest={false} depthWrite={false} />
    </World>
</Canvas>
