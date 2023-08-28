<script lang="ts">
    import { T } from "@threlte/core";
    import { Instance, InstancedMesh, OrbitControls, interactivity } from "@threlte/extras";
    import ModelPartWithInstancing from "./ModelPartWithInstancing.svelte";
    import {
        BoxGeometry,
        MeshStandardMaterial,
        PerspectiveCamera,
    } from "three";
    import { onMount } from "svelte";

    interactivity();

    export let camera: PerspectiveCamera;
    export let models;

    // const { world } = useRapier();
    // const noGravity = () => (world.gravity = { x: 0, y: 0, z: 0 });

    onMount(() => {
        // noGravity();
    });
    
</script>

<T.PerspectiveCamera
    bind:ref={camera}
    makeDefault
    position={[0, 0, 50]}
    fov={24}
>
    <OrbitControls enableDamping />
</T.PerspectiveCamera>

<T.DirectionalLight castShadow position={[3, 10, 10]} />
<T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
<T.AmbientLight intensity={0.2} />

{#each models as model}
    <!-- <ModelPart {model}/> -->
    <ModelPartWithInstancing {model} />
{/each}

<T.Group position={[0, -20, 0]}>
        <T.Mesh
            receiveShadow
            geometry={new BoxGeometry(50, 1, 50)}
            material={new MeshStandardMaterial()}
            on:click={() => {console.log("test test test")}}
        />
</T.Group>
