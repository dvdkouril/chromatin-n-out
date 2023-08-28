<script lang="ts">
    import { T, useFrame } from "@threlte/core";
    import { Instance, InstancedMesh, interactivity } from "@threlte/extras";

    export let model;
    //~ TODO: calculate world position from screen space position

    const sphereRadius = 0.1;
    const tubeBaseSize = 0.05;

    let modelScale = 1.0;

    let instMesh;
    $: console.log("instMesh changed: " + instMesh);
    let bSphere = instMesh ? instMesh.computeBoundingSphere() : null;

    // interactivity();
</script>

    <T.Group
        position={[model.position.x, model.position.y, model.position.z]}
        scale={[modelScale, modelScale, modelScale]}
        on:click={() => {
            console.log("clicked");
            modelScale = modelScale * 1.01;
        }}
    >
        <!-- Tubes connecting bin positions -->
        <InstancedMesh bind:ref={instMesh}>
            <T.CylinderGeometry args={[tubeBaseSize, tubeBaseSize, 1.0]} />
            <T.MeshStandardMaterial color="#aaaaaa" />

            {#each model.tubes as tube, i}
                <Instance
                    position={tube.position.toArray()}
                    rotation={tube.rotation.toArray()}
                    scale.y={tube.scale}
                />
            {/each}
        </InstancedMesh>

        <!-- Spheres at bin positions -->
        <InstancedMesh>
            <T.SphereGeometry args={[sphereRadius]} />
            <T.MeshStandardMaterial color="#aaaaaa" />

            {#each model.spheres as s, i}
                <Instance position.x={s.x} position.y={s.y} position.z={s.z} />
            {/each}
        </InstancedMesh>
    </T.Group>
