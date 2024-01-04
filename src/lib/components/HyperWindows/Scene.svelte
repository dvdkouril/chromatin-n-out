<script lang="ts">
    import { T } from "@threlte/core";
    import ModelPartWithInstancing from "./ModelPartWithInstancing.svelte";
    import type { PerspectiveCamera, Vector2 } from "three";
    import { onMount } from "svelte";
    import { computeBoundingCircle, projectModelToScreenSpace } from "../../util";
    import type { BoundingSphere, HyperWindow } from "../../hyperwindows-types";
    import Matter from "matter-js";

    //~ TODO: change to a better design
    export let engine: Matter.Engine; //~ TODO: I might instead just send a function
                                        //~     to check where the click landed
    export let canvas: HTMLElement; //~ should come from useThrelte renderer

    //~ Threlte lifecycle
    // const { renderer, size } = useThrelte();

    //~ DOM
    // const canvas = renderer?.domElement;
    let lastMousePos = { x: 0, y: 0 };
    let dragging = false;
    export let canvasWidth = 123;
    export let canvasHeight = 123;
    
    // export let matterjsDebugCanvas: HTMLCanvasElement | undefined;

    //~ Actual scene content
    export let hyperWindows: HyperWindow[];
    export let camera: PerspectiveCamera;

    //~ exports
    export let boundingSpheres: BoundingSphere[]; //~ sending up the computed bounding spheres (center+radius)
    // export let debugPositions: [Vector2, string][]; //~ sending up just the projected bin positions
    export let debugTexts: { text: string; x: number; y: number }[];
    // export let showMatterDebug: boolean;

    
    const onMouseDown = (e: MouseEvent) => {
        if ((e.target == null) || !(e.target instanceof Element)) {
            return;
        }
        
        dragging = true;

        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        lastMousePos = { x: x, y: y };
    };

    const onTouchStart = (e: TouchEvent) => {
        switch (e.touches.length) {
            case 1:
                if (e.target == undefined) {
                    break;
                }
                if (e.target instanceof Element) {
                    dragging = true;

                    let rect = e.target.getBoundingClientRect();
                    let x = e.touches[0].clientX - rect.left; //x position within the element.
                    let y = e.touches[0].clientY - rect.top; //y position within the element.

                    lastMousePos = { x: x, y: y };
                }
                break;
            // case 2: break;
            default:
                break;
        }
    };

    const onMouseUp = (_: MouseEvent) => {
        dragging = false;
    };

    const onTouchEnd = (_: TouchEvent) => {
        dragging = false;
    };

    
    const onMouseMove = (e: MouseEvent) => {
        if ((e.target == null) || (!(e.target instanceof Element))) {
            return;
        }

        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        if (dragging) {
            processOrbiting(x, y);
        }
    };

    const onTouchMove = (event: TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const firstTouch = event.touches[0];
        const elUnderTouch = document.elementFromPoint(firstTouch.clientX, firstTouch.clientY);

        if ((elUnderTouch == null) || (event.target == null) ||
            (!(event.target instanceof Element))) {
            return;
        }

        let rect = event.target.getBoundingClientRect();
        let x = firstTouch.clientX - rect.left; //x position within the element.
        let y = firstTouch.clientY - rect.top; //y position within the element.

        if (dragging) {
            processOrbiting(x, y);
        }
    };

    /**
     * Local orbiting (ray casting the associated Matterjs body)
     * @param e
     */
    const processOrbiting = (x: number, y: number) => {
        //~ use the x,y to query the physics engine; get the body under cursor
        let hitBodies = Matter.Query.point(engine.world.bodies, { x: x, y: y });
        if (hitBodies.length > 0) {
            let b = hitBodies[0]; //~ assume for now that we don't have overlapping bodies
            const bodyId = b.id;

            //TODO: better way to fetch hyperwindow associated with this body? (probably need some map structure)
            let hprWindow = hyperWindows[0]; // just for testing
            for (let hw of hyperWindows) {
                if (hw.associatedBodyId == bodyId) {
                    hprWindow = hw;
                }
            }

            const deltaX = x - lastMousePos.x;
            const deltaY = y - lastMousePos.y;
            const orbitingSpeed = 0.8;
            hprWindow.threeDView.rotationX += orbitingSpeed * deltaX;
            hprWindow.threeDView.rotationY += orbitingSpeed * deltaY;

            lastMousePos = { x: x, y: y };

            //~ adjust Matter.js body: Scale
            let [_, radius] = computeBoundingSphere(hprWindow, camera);
            const currentRadius = hprWindow.currentRadius;
            const wantedRadius = radius;
            const scaleFactor = wantedRadius / currentRadius;
            hprWindow.currentRadius = wantedRadius;

            Matter.Body.scale(b, scaleFactor, scaleFactor);

            //~ adjust Matter.js body:  Position
            // const wantedPos = center;
            // const currentPos = new Vector2(b.position.x, b.position.y);
            // const offset = wantedPos.clone().sub(currentPos);

            // Matter.Body.translate(b, { x: offset.x, y: offset.y });

            // recomputeBoundingSpheres(hyperWindows); //~ TODO: I guess it's unnecessary to compute BS twice
        }
    };

    
    const onWheel = (e: WheelEvent) => {
        //~ disable scrolling the page with mouse wheel
        e.preventDefault();
        e.stopPropagation();

        if ((e.target == null) || (!(e.target instanceof Element))) {
            return;
        }

        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.

        processZooming(x, y, e.deltaY);
    };
    
    /**
     * Local zooming
     */
    const processZooming = (x: number, y: number, delta: number) => {
        //~ use the x,y to query the physics engine; get the body under cursor
        let hitBodies = Matter.Query.point(engine.world.bodies, { x: x, y: y });
        if (hitBodies.length > 0) {
            let b = hitBodies[0]; //~ assume for now that we don't have overlapping bodies
            const bodyId = b.id;

            //~ fetch hyperwindow associated with this body
            let hprWindow = hyperWindows[0];
            for (let hw of hyperWindows) {
                if (hw.associatedBodyId == bodyId) {
                    hprWindow = hw;
                }
            }

            const zoomingSpeed = 0.001;
            hprWindow.threeDView.zoom += zoomingSpeed * delta;

            //~ adjust Matter.js body: Scale
            let [_, radius] = computeBoundingSphere(hprWindow, camera);
            const currentRadius = hprWindow.currentRadius;
            const wantedRadius = radius;
            const scaleFactor = wantedRadius / currentRadius;
            hprWindow.currentRadius = wantedRadius;

            Matter.Body.scale(b, scaleFactor, scaleFactor);

            //~ adjust Matter.js body:  Position
            // const wantedPos = center;
            // const currentPos = new Vector2(b.position.x, b.position.y);
            // const offset = wantedPos.clone().sub(currentPos);

            // Matter.Body.translate(b, { x: offset.x, y: offset.y });

            //~ in order to trigger redraw in the ModelPartWithInstancing
            // hyperWindows = hyperWindows;
            // recomputeBoundingSpheres(hyperWindows); //~ TODO: I guess it's unnecessary to compute BS twice
        }
    };

    onMount(() => {
        //~ register events
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("wheel", onWheel);
        canvas.addEventListener("touchstart", onTouchStart);
        canvas.addEventListener("touchend", onTouchEnd);
        canvas.addEventListener("touchmove", onTouchMove);

        recomputeBoundingSpheres(hyperWindows);
    });

    /**
     *
     * @param pointsIn3D an array of points in 3D which will be projected into 2D and then the computation of a bounding sphere bounding "circle"
     * returns a 2D position and a radius of the bounding circle
     */
    const computeBoundingSphere = (hyperwindow: HyperWindow, camera: PerspectiveCamera): [Vector2, number]  => {
        //~ 1. project points into screen space
        const pointsIn2D = projectModelToScreenSpace(hyperwindow, camera, canvasWidth, canvasHeight);
        //DEBUG
        // debugPositions = debugPositions.concat(pointsIn2D);

        //~ 2. Ritter's bounding sphere algorithm (in 2D)
        const bSphere = computeBoundingCircle(pointsIn2D);

        return bSphere;
    };

    const recomputeBoundingSpheres = (hyperwindows: HyperWindow[]) => {
        if (camera == undefined) {
            return;
        }
        boundingSpheres = [];
        debugTexts = [];
        for (let hw of hyperwindows) {
            let [center, radius] = computeBoundingSphere(hw, camera);
            boundingSpheres.push({ center: center, radius: radius });
            debugTexts.push({
                text: "[" + center.x + ", " + center.y + "]",
                x: center.x,
                y: center.y,
            });
        }
        boundingSpheres = boundingSpheres;
    };

</script>

<T.PerspectiveCamera bind:ref={camera} makeDefault position={[0, 0, 50]} fov={24} />

<T.DirectionalLight castShadow position={[3, 10, 10]} />
<T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
<T.AmbientLight intensity={0.2} />

{#each hyperWindows as hw}
    <ModelPartWithInstancing model={hw.model} viewParams={hw.threeDView} selections={hw.widget.selections} />
{/each}
