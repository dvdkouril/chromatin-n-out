<script lang="ts">
    import { T } from "@threlte/core";
    import { Instance, InstancedMesh } from "@threlte/extras";
    import type { HW3DView, HWGeometry } from "../../../hyperwindows-types";

    export let model: HWGeometry;
    export let viewParams: HW3DView;
</script>

<T.Group
    position={[
        viewParams.worldPosition.x,
        viewParams.worldPosition.y,
        viewParams.worldPosition.z,
    ]}
    scale={[viewParams.zoom, viewParams.zoom, viewParams.zoom]}
    rotation={[
        (viewParams.rotationY * Math.PI) / 180,
        (viewParams.rotationX * Math.PI) / 180,
        0,
    ]}
>
    <!-- Tubes connecting the bin positions -->
    <InstancedMesh>
        <T.CylinderGeometry
            args={[model.tubeBaseSize, model.tubeBaseSize, 1.0]}
        />
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
        <T.SphereGeometry args={[model.sphereRadius]} />
        <T.MeshStandardMaterial color="#aaaaaa" />

        {#each model.spheres as s, i}
            <Instance position.x={s.x} position.y={s.y} position.z={s.z} />
        {/each}
    </InstancedMesh>
</T.Group>
