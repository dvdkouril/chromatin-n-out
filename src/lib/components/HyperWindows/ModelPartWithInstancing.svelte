<script lang="ts">
    import { T } from "@threlte/core";
    import { Instance, InstancedMesh } from "@threlte/extras";
    import type { HW3DView, HWGeometry, Selection } from "../../hyperwindows-types";
    import { hoveredBin } from "$lib/stores";
    import { isHoveredBin } from "$lib/util";

    export let model: HWGeometry;
    export let viewParams: HW3DView;
    export let hyperWindowId: number;

    export let selections: Selection[];

    const getSelectionOrBaseColor = (sels: Selection[], binId: number) => {
        if (isHoveredBin($hoveredBin, binId, hyperWindowId)) {
            return "red";
        }
        for (let sel of sels) {
            
            if (binId <= sel.end && binId >= sel.start) {
                return sel.color;
            }
        }
        return "#ffffff";
    };

    const onHoverStart = (e) => {
        console.log("hovered!");
        console.log(e.instanceId);
        const binId = e.instanceId;
        $hoveredBin = {
            hwId: hyperWindowId,
            binId: binId, 
        };
    };

    const onHoverEnd = (e) => {
        $hoveredBin = undefined;
    };

    const mapValueToColor = () => {
    };
</script>

<T.Group
    position={[model.modelWorldPosition.x, model.modelWorldPosition.y, model.modelWorldPosition.z]}
    scale={[viewParams.zoom, viewParams.zoom, viewParams.zoom]}
    rotation={[(viewParams.rotationY * Math.PI) / 180, (viewParams.rotationX * Math.PI) / 180, 0]}
>
    <!-- Tubes connecting the bin positions -->
    <InstancedMesh limit={30000} range={30000}>
        <T.CylinderGeometry args={[model.tubeBaseSize, model.tubeBaseSize, 1.0, 3, 1]} />
        <T.MeshStandardMaterial color="#ffffff" />

        {#each model.tubes as tube, i}
            <Instance
                position={tube.position.toArray()}
                rotation={[tube.rotation.x, tube.rotation.y, tube.rotation.z, tube.rotation.order]}
                color={getSelectionOrBaseColor(selections, i)}
                scale.y={tube.scale}
                on:click={(e) => {
                    console.log('clicked tube');
                    console.log(e.instanceId);
                  }}
            />
        {/each}
    </InstancedMesh>

    <!-- Spheres at bin positions -->
    <InstancedMesh limit={30000} range={30000}>
        <T.SphereGeometry args={[model.sphereRadius]} />
        <T.MeshStandardMaterial color="#ffffff" />

        {#each model.spheres as s, i}
            <Instance position={s.toArray()} color={getSelectionOrBaseColor(selections, i)}
                on:click={(e) => {
                    console.log('clicked sphere');
                    console.log(e.instanceId);
                    console.log(e.nativeEvent.altKey);
                  }}
                on:pointerenter={onHoverStart}
                on:pointerleave={onHoverEnd}
            />
        {/each}
    </InstancedMesh>

    <!-- Debug: Pivot point indication -->
    {#if viewParams.viewSettings.showPivotOrigin}
        <T.Mesh>
            <T.BoxGeometry args={[0.5, 0.5, 0.5]} />
            <T.MeshStandardMaterial color="#ff0000" />
        </T.Mesh>
    {/if}
</T.Group>
