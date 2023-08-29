<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "../components/Scene.svelte";
    
    let parentElement = null;

    let width = 800;
    let height = 600;
</script>

<div>Big canvas!</div>
<Canvas size={{ width: width, height: height }}>
    <Scene {parentElement} />
</Canvas>

<div bind:this={parentElement} />
