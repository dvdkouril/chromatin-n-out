<script lang="ts">
    import { Canvas, InteractiveObject, OrbitControls, T } from "@threlte/core";
    import { degToRad } from "three/src/math/MathUtils";
    import { vec3, quat } from 'gl-matrix';
    import { Euler, Quaternion, Vector3 } from "three";
    // import { scale } from "svelte/types/runtime/transition";

    const radiusScale = 0.1;
    const sphereRadius = 0.1;
    const tubeBaseSize = 0.05;

    export let width;
    export let height;
    export let offset;
    // export let spheres = [{x: 0, y: 0, z: 0}];
    // export let spheres = [{x: 0, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 0, y: 1, z: 1}];
    // export let spheres = [{x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 0}];
    export let spheres = [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 0, y: 1, z: 0}];
    $: spheresCentered = recenter(spheres).map((pos: vec3) => { return {x: pos[0], y: pos[1], z: pos[2]} });
    $: tubes = computeTubes(spheresCentered);
    // export let selection = { start: 0, end: 10};
    // export let selection;
    // export let selectionColor;
    // export let selectionColors;
    export let selections;

    const recenter = (
        ogPositions: { x: number; y: number; z: number }[]
    ): vec3[] => {
        let positions = ogPositions.map(({x, y, z}) => vec3.fromValues(x, y, z));

        let bbMax = positions.reduce(
            (a, b) => vec3.max(vec3.create(), a, b),
            vec3.fromValues(
                Number.MIN_VALUE,
                Number.MIN_VALUE,
                Number.MIN_VALUE
            )
        );
        let bbMin = positions.reduce(
            (a, b) => vec3.min(vec3.create(), a, b),
            vec3.fromValues(
                Number.MAX_VALUE,
                Number.MAX_VALUE,
                Number.MAX_VALUE
            )
        );
        let bbCenter = vec3.scale(
            vec3.create(),
            vec3.add(vec3.create(), bbMax, bbMin),
            0.5
        );
        let bbSides = vec3.sub(vec3.create(), bbMax, bbMin);
        bbSides.forEach((v: number) => Math.abs(v));
        const largestSide = Math.max(...bbSides);
        let bbLength = vec3.fromValues(
            1.0 / largestSide,
            1.0 / largestSide,
            1.0 / largestSide
        );
        const atomsNormalized = positions.map((a) =>
            // vec3.mul(
            //     vec3.create(),
            //     vec3.sub(vec3.create(), a, bbCenter),
            //     bbLength
            // )
            vec3.sub(vec3.create(), a, bbCenter)
        );
        // atoms = atomsNormalized;

        // let test = spheres.map((pos: vec3) => { return {x: pos[0], y: pos[1], z: pos[2]} });

        return atomsNormalized;
    };

    const computeTubes = (bins: { x: number; y: number; z: number }[]) => {
        let t = [];
        for (let i = 0; i < bins.length - 1; i++) {
            const first = new Vector3(bins[i].x, bins[i].y, bins[i].z);
            const second = new Vector3(bins[i + 1].x, bins[i + 1].y, bins[i + 1].z);

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

            t.push({position: tubePosition, rotation: tubeRotation, scale: tubeScale});
        }

        // console.log(t);
        return t;
    }

    const getRotationFromTwoPositions = (from: Vector3, to: Vector3) => {
        const fromCopy = new Vector3(from.x, from.y, from.z);
        const toCopy = new Vector3(to.x, to.y, to.z);
        let q = new Quaternion();
        const u = new Vector3(0, 1, 0);
        const v = toCopy.sub(fromCopy).normalize();

        q.setFromUnitVectors(u, v);      

        const eulers = new Euler();
        return eulers.setFromQuaternion(q);
    } 

    const getSelectionOrBaseColor = (binId: number) => { 
        for (let sel of selections) {
            if ((binId <= sel.end) && (binId >= sel.start)) {
                console.log("TESTTTTTTTTTTTT");
                return sel.color;
            }
        }
        return "#aaaaaa";
    }
    
</script>

                    <!-- quaternion={(i < spheresCentered.length - 1) ? getRotationFromTwoPositions(vec3.fromValues(s.x, s.y, s.z), vec3.fromValues(spheresCentered[i+1].x, spheresCentered[i+1].y, spheresCentered[i+1].z)) : new Quaternion()} -->
<div style="width: {width}px; height: {height}px; margin: {offset}px; z-index: 1;">
    <Canvas>
        <!-- <T.PerspectiveCamera makeDefault position={[10, 10, 20]} fov={24}> -->
        <T.PerspectiveCamera makeDefault position={[0, 0, 20]} fov={24}>
            <OrbitControls
                maxPolarAngle={degToRad(90)}
                enableZoom={true}
                target={{ y: 0.5 }}
            />
        </T.PerspectiveCamera>

        <T.DirectionalLight castShadow position={[3, 10, 10]} />
        <T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
        <T.AmbientLight intensity={0.2} />
 
        <T.Group>
            {#each tubes as tube, i}
                <T.Mesh position={tube.position.toArray()}
                    castShadow
                    rotation={tube.rotation.toArray()}
                    let:ref
                >
                    
                    <T.CylinderGeometry args={[tubeBaseSize, tubeBaseSize, tube.scale]} />
                    <!-- {#if selection != null && i <= selection.end && i >= selection.start} -->
                        <!-- <T.MeshStandardMaterial color={selectionColors[i - selection.start]} /> -->
                    <!-- {:else}  -->
                        <!-- <T.MeshStandardMaterial color="#aaaaaa" /> -->
                    <!-- {/if} -->
                    <T.MeshStandardMaterial color={getSelectionOrBaseColor(i)} />
                </T.Mesh>
            {/each}
            {#each spheresCentered as s, i}
                <T.Mesh
                    position.y={s.y}
                    position.x={s.x}
                    position.z={s.z}
                    castShadow
                    let:ref
                >
                    <T.SphereGeometry args={[sphereRadius]} />
                    <!-- {#if selection != null && i <= selection.end && i >= selection.start}
                        <T.MeshStandardMaterial color={selectionColors[i - selection.start]} />
                    {:else}  -->
                        <!-- <T.MeshStandardMaterial color="#aaaaaa" /> -->
                    <!-- {/if} -->
                    <T.MeshStandardMaterial color={getSelectionOrBaseColor(i)} />
                </T.Mesh>
            {/each}
        </T.Group>
    </Canvas>
    <!-- <p># spheres = {spheres.length}</p> -->
    <!-- <p># tubes = {tubes.length}</p> -->
</div>
<div>TEST</div>

<style>
    div {
        height: 100%;
        width: 100%;
    }
</style>
