<script lang="ts">
    import { Canvas, InteractiveObject, OrbitControls, T } from "@threlte/core";
    import { degToRad } from "three/src/math/MathUtils";
    import { vec3 } from 'gl-matrix';

    const radiusScale = 0.2;

    export let width;
    export let height;
    export let offset;
    export let spheres = [];
    $: spheresCentered = recenter(spheres).map((pos: vec3) => { return {x: pos[0], y: pos[1], z: pos[2]} });
    // export let selection = { start: 0, end: 10};
    export let selection;
    export let selectionColor;
    // $: selectionRelative = 

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
</script>

<div style="width: {width}px; height: {height}px; margin: {offset}px; z-index: 1;">
    <Canvas>
        <T.PerspectiveCamera makeDefault position={[10, 10, 20]} fov={24}>
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
            {#each spheresCentered as s, i}
                <T.Mesh
                    position.y={s.y}
                    position.x={s.x}
                    position.z={s.z}
                    scale={radiusScale}
                    castShadow
                    let:ref
                >
                    <T.SphereGeometry />
                    {#if selection != null && i <= selection.end && i >= selection.start}
                        <T.MeshStandardMaterial color={selectionColor} />
                    {:else} 
                        <T.MeshStandardMaterial color="#aaaaaa" />
                    {/if}
                </T.Mesh>
            {/each}
        </T.Group>

        <!-- Floor -->
        <!-- <T.Mesh receiveShadow rotation.x={degToRad(-90)}>
            <T.CircleGeometry args={[3, 72]} />
            <T.MeshStandardMaterial color="#333333" />
        </T.Mesh> -->
    </Canvas>
</div>

<style>
    div {
        height: 100%;
        width: 100%;
    }
</style>
