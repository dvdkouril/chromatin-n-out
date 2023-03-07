<script lang="ts">
    import { Canvas, InteractiveObject, OrbitControls, T } from "@threlte/core";
    import { onMount } from "svelte";
    import { spring } from "svelte/motion";
    import { degToRad } from "three/src/math/MathUtils";
    import {parsePdb} from "./pdb";
    import { brafl } from "./test_BRAFL";

    // const scale = spring(1);
    const scale = 0.02;

    let spheres = [{x: 0, y: 0, z: 0}];

    const randomPositions = (num: number): {x: number, y: number, z: number}[] => {
        let newSpheresArr = [];
        const max = 50;
        for (let i = 0; i < num; i++) {
            const x = Math.random() * max;
            const y = Math.random() * max;
            const z = Math.random() * max;
            newSpheresArr.push({x: x, y: y, z: z});
        }
        return newSpheresArr;
    }

    onMount(() => {
        // spheres = randomPositions(100);
        spheres = parsePdb(brafl).bins;
    });
</script>

<div style="width: 600px; height: 400px;">
    <Canvas>
        <T.PerspectiveCamera makeDefault position={[10, 10, 10]} fov={24}>
            <OrbitControls
                maxPolarAngle={degToRad(80)}
                enableZoom={false}
                target={{ y: 0.5 }}
            />
        </T.PerspectiveCamera>

        <T.DirectionalLight castShadow position={[3, 10, 10]} />
        <T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
        <T.AmbientLight intensity={0.2} />

        <!-- Cube -->
        <!-- <T.Group scale={$scale}> -->
        <T.Group scale={scale}>
            {#each spheres as s}
                <T.Mesh
                    position.y={s.y}
                    position.x={s.x}
                    position.z={s.z}
                    castShadow
                    let:ref
                >
                    <!-- Add interaction -->
                    <!-- <InteractiveObject
                        object={ref}
                        interactive
                        on:pointerenter={() => ($scale = 0.2)}
                        on:pointerleave={() => ($scale = 0.1)}
                    /> -->

                    <!-- <T.BoxGeometry /> -->
                    <T.SphereGeometry />
                    <T.MeshStandardMaterial color="#333333" />
                </T.Mesh>
            {/each}
        </T.Group>

        <!-- Floor -->
        <T.Mesh receiveShadow rotation.x={degToRad(-90)}>
            <T.CircleGeometry args={[3, 72]} />
            <T.MeshStandardMaterial color="white" />
        </T.Mesh>
    </Canvas>
</div>

<style>
    div {
        height: 100%;
        width: 100%;
    }
</style>
