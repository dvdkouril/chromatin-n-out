<script lang="ts">
    import { T } from "@threlte/core";
    import { Instance, InstancedMesh, type IntersectionEvent } from "@threlte/extras";
    import type { HW3DView, HWGeometry, Selection } from "../../hyperwindows-types";
    import { hoveredBin, spatialSelection } from "$lib/stores";
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

    const onHoverStart = (e: IntersectionEvent<PointerEvent>) => {
        const binId = e.instanceId;

        if (!binId) return;

        e.stopPropagation();

        $hoveredBin = {
            hwId: hyperWindowId,
            binId: binId, 
        };
    };

    const onHoverEnd = (_: IntersectionEvent<PointerEvent>) => {
        $hoveredBin = undefined;
    };

    const processPointerDown = (e: IntersectionEvent<PointerEvent>) => {
        if (!e.nativeEvent.shiftKey) {
            return;
        }

        const binId = e.instanceId; 
        if (!binId) {
            return;
        }

        if ((e.nativeEvent.target == null) || (!(e.nativeEvent.target instanceof Element))) {
            return;
        }

        //~ https://threlte.xyz/docs/reference/extras/interactivity#event-propagation
        e.stopPropagation();

        let rect = e.nativeEvent.target.getBoundingClientRect();
        let x = e.nativeEvent.clientX - rect.left; //x position within the element.
        let y = e.nativeEvent.clientY - rect.top; //y position within the element.

        $spatialSelection = {
            hwId: hyperWindowId,
            originBinId: binId,
            radius: 0.1,
            startMousePos: { x: x, y: y },
            selection: {
                bins: [],
                connectedBins: [],
            }
        };
    };

    // const processPointerUp = (e: IntersectionEvent<PointerEvent>) => {
    //     $spatialSelection = undefined;
    //     console.log("ending spatial selection!");
    // };

    //~ TODO: the actual selection will happen in Canvas:onDrag / onMouseMove, here I'm just switching the app to a state where the spatial selection is in progress

    // const mapValueToColor = () => {
    // };
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
                on:pointerdown={processPointerDown}
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

    <!-- Debug: Spatial selection sphere -->
    {#if ($spatialSelection && ($spatialSelection.hwId == hyperWindowId)) }
        <T.Mesh position={[model.spheres[$spatialSelection.originBinId].x,
                            model.spheres[$spatialSelection.originBinId].y,
                            model.spheres[$spatialSelection.originBinId].z]} >
            <T.SphereGeometry args={[$spatialSelection.radius]} />
            <T.MeshStandardMaterial color="#ff0000" opacity={0.5} transparent={true} />
        </T.Mesh>
    {/if}
</T.Group>
