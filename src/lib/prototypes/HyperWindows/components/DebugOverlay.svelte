<script lang="ts">
    export let canvasWidth;
    export let canvasHeight;
    export let boundingSpheres;
    export let debugPositions;
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
    {#each debugPositions as p}
        <circle cx={p.x} cy={p.y} r={3} fill="green" opacity={0.3} />
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
</style>
