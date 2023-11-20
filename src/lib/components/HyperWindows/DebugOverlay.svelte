<script lang="ts">
    import type { BoundingSphere } from "$lib/hyperwindows-types";
    import type { Vector2 } from "three";

    export let canvasWidth: number;
    export let canvasHeight: number;
    export let boundingSpheres: BoundingSphere[];
    export let debugPositions: [Vector2, string][];
    export let debugTexts: { text: string, x: number, y: number }[];
</script>

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
    {#each debugPositions as [p, col]}
        <circle cx={p.x} cy={p.y} r={10} fill={col} opacity={0.9} />
    {/each}
    {#each debugTexts as t}
        <text x={t.x} y={t.y} class="debug-text">{t.text}</text>
    {/each}
</svg>

<style>
    #debug-overlay {
        overflow: hidden;
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
    }

    .debug-text {
        fill: white;
        background-color: white;
    }
</style>
