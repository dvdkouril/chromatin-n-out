<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "../components/Scene.svelte";
    import type { Vector2 } from "three";

    let parentElement = null;
    let boundingSpheres: { center: Vector2; radius: number }[] = [];
    let debugPositions: Vector2[] = [];

    let width = 800;
    let height = 600;
</script>

<div id="canvas-container">
    <div>Big canvas!</div>
    <Canvas size={{ width: width, height: height }}>
        <Scene {parentElement} bind:boundingSpheres bind:debugPositions />
    </Canvas>

    <div>
        <svg width="800" height="600" id="debug-overlay">
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
</div>

<div bind:this={parentElement} />

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
    }
</style>
