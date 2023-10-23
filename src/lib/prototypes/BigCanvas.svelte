<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "../components/Scene.svelte";

    let parentElement = null;
    let boundingSphere_Center = null;
    let boundingSphere_Radius = null;

    let width = 800;
    let height = 600;
</script>

<div>Big canvas!</div>
<Canvas size={{ width: width, height: height }}>
    <Scene
        {parentElement}
        bind:boundingSphere_Center
        bind:boundingSphere_Radius
    />
</Canvas>

<svg width="800" height="600">
    {#if boundingSphere_Center != null}
        <circle cx={boundingSphere_Center.x * width} cy={boundingSphere_Center.y * height} r={boundingSphere_Radius} fill="red" />
    {/if}
    <circle cx={100} cy={100} r={10} fill="red" />
</svg>

<div bind:this={parentElement} />
