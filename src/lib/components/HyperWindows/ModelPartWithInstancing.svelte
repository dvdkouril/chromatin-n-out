<script lang="ts">
    import { T } from "@threlte/core";
    import { Instance, InstancedMesh } from "@threlte/extras";
    import type { HW3DView, HWGeometry, Selection } from "../../hyperwindows-types";

    export let model: HWGeometry;
    export let viewParams: HW3DView;

    export let selections: Selection[];

    const getSelectionOrBaseColor = (sels: Selection[], binId: number) => {
        for (let sel of sels) {
            // if (binId == hoveredBin) {
            //     return "red";
            // }
            if (binId <= sel.end && binId >= sel.start) {
                return sel.color;
            }
        }
        return "#aaaaaa";
    };
</script>

<T.Group
    position={[model.modelWorldPosition.x, model.modelWorldPosition.y, model.modelWorldPosition.z]}
    scale={[viewParams.zoom, viewParams.zoom, viewParams.zoom]}
    rotation={[(viewParams.rotationY * Math.PI) / 180, (viewParams.rotationX * Math.PI) / 180, 0]}
>
    <!-- Tubes connecting the bin positions -->
    <InstancedMesh>
        <T.CylinderGeometry args={[model.tubeBaseSize, model.tubeBaseSize, 1.0]} />
        <T.MeshStandardMaterial color="#ffffff" />

        {#each model.tubes as tube, i}
            <Instance
                position={tube.position.toArray()}
                rotation={[tube.rotation.x, tube.rotation.y, tube.rotation.z, tube.rotation.order]}
                color={getSelectionOrBaseColor(selections, i)}
                scale.y={tube.scale}
            />
        {/each}
    </InstancedMesh>

    <!-- Spheres at bin positions -->
    <InstancedMesh>
        <T.SphereGeometry args={[model.sphereRadius]} />
        <T.MeshStandardMaterial color="#ffffff" />

        {#each model.spheres as s, i}
            <Instance
                position={s.toArray()}
                color={getSelectionOrBaseColor(selections, i)}
            />
        {/each}
    </InstancedMesh>

    <!-- Debug: Pivot point indication -->
    <T.Mesh>
        <T.BoxGeometry args={[0.5, 0.5, 0.5]} />
        <T.MeshStandardMaterial color="#ff0000" />
    </T.Mesh>
</T.Group>
