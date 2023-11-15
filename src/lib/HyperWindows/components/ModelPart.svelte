<script lang="ts">
    import { T } from "@threlte/core";
    export let model;

    const sphereRadius = 0.1;
    const tubeBaseSize = 0.05;
</script>

<T.Group position={[model.position.x, model.position.y, model.position.z]}>
    {#each model.tubes as tube, i}
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
                color="#aaaaaa"
            />
        </T.Mesh>
    {/each}
    {#each model.spheres as s, i}
        <T.Mesh
            position.y={s.y}
            position.x={s.x}
            position.z={s.z}
            castShadow
            interactive
            let:ref
        >
            <T.SphereGeometry args={[sphereRadius]} />
            <T.MeshStandardMaterial
                color="#aaaaaa"
            />
        </T.Mesh>
    {/each}
</T.Group>
