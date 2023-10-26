<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "./components/Scene.svelte";
    import type { Vector2 } from "three";
    import DebugOverlay from "./components/DebugOverlay.svelte";
    import SelectionsLayer from "./components/SelectionsLayer.svelte";

    let boundingSpheres: { center: Vector2; radius: number }[] = [];
    let debugPositions: Vector2[] = [];

    let canvasWidth; //~ binding these upwards with useThrelte
    let canvasHeight;
</script>

<div id="canvas-container">
    <!-- Canvas containing 3D models -->
    <Canvas>
        <Scene
            bind:canvasWidth
            bind:canvasHeight
            bind:boundingSpheres
            bind:debugPositions
        />
    </Canvas>

    <!-- SVG debug overlay -->
   <DebugOverlay {canvasWidth} {canvasHeight} {boundingSpheres} {debugPositions} /> 

   <!-- SVG-based layer with selection widgets for each 3D (sub)model -->
   <SelectionsLayer />

</div>

<style>
    #canvas-container {
        overflow: hidden;
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>
