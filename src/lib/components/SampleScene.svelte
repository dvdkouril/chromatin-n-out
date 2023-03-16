<script lang="ts">
    import { Canvas, InteractiveObject, OrbitControls, T } from "@threlte/core";
    import { degToRad } from "three/src/math/MathUtils";
    import { vec3, quat } from 'gl-matrix';
    import { Euler, Quaternion, Vector3 } from "three";

    const radiusScale = 0.2;

    export let width;
    export let height;
    export let offset;
    export let spheres = [{x: 0, y: 0, z: 0}];
    $: spheresCentered = recenter(spheres).map((pos: vec3) => { return {x: pos[0], y: pos[1], z: pos[2]} });
    // export let selection = { start: 0, end: 10};
    export let selection;
    export let selectionColor;
    export let selectionColors;
    // $: selectionRelative = 

    const recenter = (
        ogPositions: { x: number; y: number; z: number }[]
    ): vec3[] => {
        let positions = ogPositions.map(({x, y, z}) => vec3.fromValues(x, y, z));

        let bbMax = positions.reduce(
            (a, b) => vec3.max(vec3.create(), a, b),
            vec3.fromValues(
                Number.MIN_VALUE,
                Number.MIN_VALUE,
                Number.MIN_VALUE
            )
        );
        let bbMin = positions.reduce(
            (a, b) => vec3.min(vec3.create(), a, b),
            vec3.fromValues(
                Number.MAX_VALUE,
                Number.MAX_VALUE,
                Number.MAX_VALUE
            )
        );
        let bbCenter = vec3.scale(
            vec3.create(),
            vec3.add(vec3.create(), bbMax, bbMin),
            0.5
        );
        let bbSides = vec3.sub(vec3.create(), bbMax, bbMin);
        bbSides.forEach((v: number) => Math.abs(v));
        const largestSide = Math.max(...bbSides);
        let bbLength = vec3.fromValues(
            1.0 / largestSide,
            1.0 / largestSide,
            1.0 / largestSide
        );
        const atomsNormalized = positions.map((a) =>
            // vec3.mul(
            //     vec3.create(),
            //     vec3.sub(vec3.create(), a, bbCenter),
            //     bbLength
            // )
            vec3.sub(vec3.create(), a, bbCenter)
        );
        // atoms = atomsNormalized;

        // let test = spheres.map((pos: vec3) => { return {x: pos[0], y: pos[1], z: pos[2]} });

        return atomsNormalized;
    };

    const getRotationFromTwoPositions = (from: vec3, to: vec3) => {
        const q = new Quaternion();
        const f = new Vector3(from[0], from[1], from[2]);
        const t = new Vector3(to[0], to[1], to[2]);
        const u = new Vector3(0, 1, 0);
        const v = t.sub(f).normalize();


        q.setFromUnitVectors(u, v);      

        const eulers = new Euler();
        return eulers.setFromQuaternion(q);

        // Quaternion.
    }

    // const getRotationFromTwoPositions = (from: vec3, to: vec3) => {
    //     const v = vec3.sub(vec3.create(), to, from);
    //     const u = vec3.fromValues(0, 1, 0);
    //     const rot = quat.rotationTo(quat.create(), u, v);
    //     // return rot;
    //     return new Quaternion(rot[0], rot[1], rot[2], rot[3]);

    //     // Quaternion.
    // }
    const getTestQuaternion = () : Quaternion => {
        return new Quaternion().identity();
    }

    const getTestRotation = () : Euler => {
        const rot = new Euler(); 
        return rot;
    }
    
</script>

                    <!-- quaternion={(i < spheresCentered.length - 1) ? getRotationFromTwoPositions(vec3.fromValues(s.x, s.y, s.z), vec3.fromValues(spheresCentered[i+1].x, spheresCentered[i+1].y, spheresCentered[i+1].z)) : new Quaternion()} -->
<div style="width: {width}px; height: {height}px; margin: {offset}px; z-index: 1;">
    <Canvas>
        <T.PerspectiveCamera makeDefault position={[10, 10, 20]} fov={24}>
            <OrbitControls
                maxPolarAngle={degToRad(90)}
                enableZoom={true}
                target={{ y: 0.5 }}
            />
        </T.PerspectiveCamera>

        <T.DirectionalLight castShadow position={[3, 10, 10]} />
        <T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
        <T.AmbientLight intensity={0.2} />

                    <!-- rotation={[0, 0 , 0]} -->
                    <!-- rotation={(i < spheresCentered.length - 1) ? getRotationFromTwoPositions(vec3.fromValues(s.x, s.y, s.z), vec3.fromValues(spheresCentered[i+1].x, spheresCentered[i+1].y, spheresCentered[i+1].z)) : new Quaternion()} -->
                    <!-- quaternion={getRotationFromTwoPositions(vec3.fromValues(1, 0, 0), vec3.fromValues(0, 1, 0))} -->
        <T.Group>
            {#each spheresCentered as s, i}
                <T.Mesh
                    position.y={s.y}
                    position.x={s.x}
                    position.z={s.z}
                    castShadow
                    scale={radiusScale}
                    rotation={(i < spheresCentered.length - 1) ? getRotationFromTwoPositions(vec3.fromValues(s.x, s.y, s.z), vec3.fromValues(spheresCentered[i+1].x, spheresCentered[i+1].y, spheresCentered[i+1].z)).toArray() : new Euler().toArray()}
                    let:ref
                >
                    <!-- <T.SphereGeometry /> -->
                    <!-- CylinderGeometry(radiusTop : Float, radiusBottom : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float) -->
                    <!-- <T.CylinderGeometry /> -->
                    <T.CylinderGeometry args={[0.3, 0.3, 3]} />
                    <!-- <T.CylinderGeometry args={[2, 2, 10]} /> -->
                    {#if selection != null && i <= selection.end && i >= selection.start}
                        <!-- <T.MeshStandardMaterial color={selectionColor} /> -->
                        <T.MeshStandardMaterial color={selectionColors[i - selection.start]} />
                    {:else} 
                        <T.MeshStandardMaterial color="#aaaaaa" />
                    {/if}
                </T.Mesh>
            {/each}
            {#each spheresCentered as s, i}
                <T.Mesh
                    position.y={s.y}
                    position.x={s.x}
                    position.z={s.z}
                    castShadow
                    scale={radiusScale}
                    let:ref
                >
                    <T.SphereGeometry />
                    {#if selection != null && i <= selection.end && i >= selection.start}
                        <!-- <T.MeshStandardMaterial color={selectionColor} /> -->
                        <T.MeshStandardMaterial color={selectionColors[i - selection.start]} />
                    {:else} 
                        <T.MeshStandardMaterial color="#aaaaaa" />
                    {/if}
                </T.Mesh>
            {/each}
        </T.Group>

        <!-- Floor -->
        <!-- <T.Mesh receiveShadow rotation.x={degToRad(-90)}>
            <T.CircleGeometry args={[3, 72]} />
            <T.MeshStandardMaterial color="#333333" />
        </T.Mesh> -->
    </Canvas>
</div>

<style>
    div {
        height: 100%;
        width: 100%;
    }
</style>
