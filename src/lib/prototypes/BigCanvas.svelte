<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "../components/Scene.svelte";
    import type { Vector2 } from "three";

    let boundingSpheres: { center: Vector2; radius: number }[] = [];
    let debugPositions: Vector2[] = [];

    let canvasWidth; //~ binding these upwards with useThrelte
    let canvasHeight;
</script>

<div id="canvas-container">
    <!-- <Canvas size={{ width: width, height: height }}> -->
    <Canvas>
        <Scene bind:canvasWidth bind:canvasHeight bind:boundingSpheres bind:debugPositions />
    </Canvas>

        <svg width={canvasWidth} height={canvasHeight} id="debug-overlay">
            {#each boundingSpheres as bs}
                <circle
                    cx={bs.center.x}
                    cy={bs.center.y}
                    r={bs.radius}
                    fill="red"
                    opacity={0.1}
                />
            {/each}
            {#each debugPositions as p}
                <circle
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill="green"
                    opacity={0.3}
                />
            {/each}
        </svg>
</div>

<style>
    #debug-overlay {
        overflow: hidden;
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
    }

    #canvas-container {
        overflow: hidden;
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>
