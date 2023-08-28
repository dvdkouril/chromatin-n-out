<script lang="ts">
    import { T } from "@threlte/core";
    import { OrbitControls } from "@threlte/extras";
    import ModelPartWithInstancing from "./ModelPartWithInstancing.svelte";
    import {
        BoxGeometry,
        MeshStandardMaterial,
        PerspectiveCamera,
        Vector2,
        Vector3,
    } from "three";
    import { onMount } from "svelte";
    import { useThrelte } from "@threlte/core";
    import { debug } from "svelte/internal";

    const { renderer } = useThrelte();
    const canvas = renderer?.domElement;

    export let camera: PerspectiveCamera;
    export let models;

    // const { world } = useRapier();
    // const noGravity = () => (world.gravity = { x: 0, y: 0, z: 0 });

    let debugPos_ObjectSpace = new Vector3(0, 0, 0);

    const unproject = (screenPosition: Vector2): Vector3 => {
        var vec = new Vector3(); // create once and reuse
        var pos = new Vector3(); // create once and reuse

        vec.set(screenPosition.x * 2 - 1, -screenPosition.y * 2 + 1, 0.5);
        vec.unproject(camera);
        vec.sub(camera.position).normalize();
        var distance = -camera.position.z / vec.z;
        pos.copy(camera.position).add(vec.multiplyScalar(distance));

        return pos;
    };

    const onMouseMove = (e) => {
        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        let canvasWidth = rect.width;
        let canvasHeight = rect.height;

        debugPos_ObjectSpace = unproject(
            new Vector2(x / canvasWidth, y / canvasHeight)
        );
        
    };

    onMount(() => {
        // noGravity();
        canvas.addEventListener("mousemove", onMouseMove);
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

<T.Group
    position={[
        debugPos_ObjectSpace.x,
        debugPos_ObjectSpace.y,
        debugPos_ObjectSpace.z,
    ]}
>
    <T.Mesh
        receiveShadow
        geometry={new BoxGeometry(1, 1, 1)}
        material={new MeshStandardMaterial()}
    />
</T.Group>

{#each models as model}
    <!-- <ModelPart {model}/> -->
    <ModelPartWithInstancing {model} />
{/each}

<T.Group position={[0, -20, 0]}>
    <T.Mesh
        receiveShadow
        geometry={new BoxGeometry(50, 1, 50)}
        material={new MeshStandardMaterial()}
        on:click={() => {
            console.log("test test test");
        }}
    />
</T.Group>
