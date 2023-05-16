<script lang="ts">
    import { T } from "@threlte/core";
    import { Instance, InstancedMesh, OrbitControls } from "@threlte/extras";
    import ModelPartWithInstancing from "./ModelPartWithInstancing.svelte";
    import { AutoColliders, useRapier } from "@threlte/rapier";
    import {
        BoxGeometry,
        MeshStandardMaterial,
        PerspectiveCamera,
    } from "three";
    import { onMount } from "svelte";

    export let camera: PerspectiveCamera;
    export let models;

    const { world } = useRapier();
    const noGravity = () => (world.gravity = { x: 0, y: 0, z: 0 });

    onMount(() => {
        noGravity();
    });

    let meshTest;
    $: console.log("meshTest: " + meshTest);
    let instMesh;
    $: console.log("instMesh: " + instMesh);
    let orbitCntrls;
    $: console.log("orbitCntrls: " + orbitCntrls);
</script>

<T.PerspectiveCamera
    bind:ref={camera}
    makeDefault
    position={[0, 0, 50]}
    fov={24}
>
    <OrbitControls enableDamping bind:ref={orbitCntrls} />
</T.PerspectiveCamera>

<T.DirectionalLight castShadow position={[3, 10, 10]} />
<T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
<T.AmbientLight intensity={0.2} />

<!-- {#each models as model} -->
    <!-- <ModelPart {model}/> -->
    <!-- <Collider shape={'cuboid'} args={[1, 1, 1]}/> -->
    <!-- <ModelPartWithInstancing {model} /> -->
<!-- {/each} -->

<!-- <InstancedMesh bind:ref={instMesh}> -->
<InstancedMesh let:ref={instMesh}>
    <T.SphereGeometry args={[0.1]} />
    <T.MeshStandardMaterial color="#aaaaaa" />

    <Instance position.x={0} position.y={0} position.z={0} />
    <Instance position.x={10} position.y={0} position.z={0} />
    <Instance position.x={-10} position.y={0} position.z={0} />
<!-- </InstancedMesh> -->
</InstancedMesh>

<T.Group position={[0, -20, 0]}>
    <AutoColliders shape={"cuboid"}>
        <T.Mesh
            receiveShadow
            geometry={new BoxGeometry(50, 1, 50)}
            material={new MeshStandardMaterial()}
            bind:ref={meshTest}
        />
    </AutoColliders>
</T.Group>
