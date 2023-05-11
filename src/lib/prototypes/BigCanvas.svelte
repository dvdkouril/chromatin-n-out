<script lang="ts">
    import { degToRad } from "three/src/math/MathUtils";
    import SampleScene from "../components/SampleScene.svelte";
    import { Canvas, T } from "@threlte/core";
    import { OrbitControls } from "@threlte/extras";
    import type { vec2, vec3 } from "gl-matrix";
    import { getRotationFromTwoPositions, recenter } from "../util";
    import { Vector2, Vector3 } from "three";

    let width = 800;
    let height = 600;

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
    $: spheresCentered = recenter(spheres).map((pos: vec3) => {
        return { x: pos[0], y: pos[1], z: pos[2] };
    });
    $: tubes = computeTubes(spheresCentered);

    let models = []; //~ [bins = {x, y, z}[], ....]

    const computeTubes = (bins: { x: number; y: number; z: number }[]) => {
        let t = [];
        for (let i = 0; i < bins.length - 1; i++) {
            const first = new Vector3(bins[i].x, bins[i].y, bins[i].z);
            const second = new Vector3(
                bins[i + 1].x,
                bins[i + 1].y,
                bins[i + 1].z
            );

            //~ position between the two bins
            const pos = new Vector3();
            pos.subVectors(second, first);
            pos.divideScalar(2);
            pos.addVectors(first, pos);
            const tubePosition = pos;
            //~ rotation
            const tubeRotation = getRotationFromTwoPositions(first, second);
            //~ tube length
            const betweenVec = new Vector3();
            betweenVec.subVectors(second, first);
            const tubeScale = betweenVec.length();

            t.push({
                position: tubePosition,
                rotation: tubeRotation,
                scale: tubeScale,
            });
        }

        // console.log(t);
        return t;
    };

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
    }

    const onclickTest = (e) => {
        console.log("canvas click");
        console.log(camera.projectionMatrix);
    }
</script>

<div>Big canvas!</div>
<button on:click={onclickTest}>debug</button>
<Canvas size={{ width: width, height: height }}>
    <T.PerspectiveCamera bind:ref={camera} makeDefault position={[0, 0, 20]} fov={24}>
        <!-- <OrbitControls
            maxPolarAngle={degToRad(90)}
            enableZoom={true}
            target={{ y: 0.5 }}
        /> -->
        <OrbitControls enableDamping />
    </T.PerspectiveCamera>

    <T.DirectionalLight castShadow position={[3, 10, 10]} />
    <T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
    <T.AmbientLight intensity={0.2} />

    {#each models as model}
        <T.Group position={[0, 0, 0]}>
        <!-- <T.Group position={[model.position.x, model.position.y, model.position.z]}> -->
        </T.Group>
    {/each}

    <T.Group>
        {#each tubes as tube, i}
            <T.Mesh
                position={tube.position.toArray()}
                castShadow
                rotation={tube.rotation.toArray()}
                let:ref
            >
                <T.CylinderGeometry
                    args={[tubeBaseSize, tubeBaseSize, tube.scale]}
                />
                <T.MeshStandardMaterial
                    color={getSelectionOrBaseColor(selections, i)}
                />
            </T.Mesh>
        {/each}
        {#each spheresCentered as s, i}
            <T.Mesh
                position.y={s.y}
                position.x={s.x}
                position.z={s.z}
                castShadow
                interactive
                on:click={onclickTest}
                let:ref
            >
                <T.SphereGeometry args={[sphereRadius]} />
                <T.MeshStandardMaterial
                    color={getSelectionOrBaseColor(selections, i)}
                />
            </T.Mesh>
        {/each}
    </T.Group>
</Canvas>
<!-- <SampleScene
    {width}
    {height}
    offset={0}
    spheres={bins}
    bind:selections={selections}
    bind:hoveredBin
/> -->
