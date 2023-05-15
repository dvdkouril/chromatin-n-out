<script lang="ts">
    import { T } from "@threlte/core";
    import { Instance, InstancedMesh } from "@threlte/extras";
    import { AutoColliders, RigidBody, useRapier } from "@threlte/rapier";
    import { onMount } from "svelte";
    export let model;

    const sphereRadius = 0.1;
    const tubeBaseSize = 0.05;

    let instMesh;
    $: console.log("instMesh changed: " + instMesh);
    let bSphere = (instMesh) ? instMesh.computeBoundingSphere() : null; 
    
    onMount(() => {
        // console.log("instMesh");
        // console.log(instMesh);
        // if (instMesh )
    }
    );
</script>

<RigidBody>
    <AutoColliders shape={"ball"}>
        <T.Group
            position={[model.position.x, model.position.y, model.position.z]}
        >
            <!-- Tubes connecting bin positions -->
            <InstancedMesh bind={instMesh}>
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
                    <Instance
                        position.x={s.x}
                        position.y={s.y}
                        position.z={s.z}
                    />
                {/each}
            </InstancedMesh>
        </T.Group>
    </AutoColliders>
</RigidBody>
