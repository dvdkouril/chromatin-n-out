<script lang="ts">
    import { T, useThrelte, type Size } from "@threlte/core";
    import ModelPartWithInstancing from "./ModelPartWithInstancing.svelte";
    import { type PerspectiveCamera, Vector2 } from "three";
    import { onDestroy, onMount } from "svelte";
    import { computeBoundingCircle, projectModelToScreenSpace, screenToUV, unprojectToWorldSpace } from "../../util";
    import type { HyperWindow, HyperWindowsLayout } from "../../hyperwindows-types";
    import { alert, canvasSize } from "$lib/stores";
   
    //~ provided from LayoutOptimizer, for querying the physics during interaction (zooming, orbiting)
    export let getHyperWindowAtPosition: (x: number, y: number) => HyperWindow | undefined;
    export let needToScaleBodyForHyperWindow: (hw: HyperWindow, scale: number) => void;

    //~ Threlte lifecycle
    const { renderer, size } = useThrelte();
    const canvas = renderer?.domElement;
    let canvasWidth = 123;
    let canvasHeight = 123;
    $: sizeChanged($size); 
    //~ Interaction
    let lastMousePos = { x: 0, y: 0 };
    let dragging = false;

    //~ Actual scene content
    export let hyperWindows: HyperWindow[];
    export let camera: PerspectiveCamera; //~ bound here and sent upwards
    export let hwLayout: HyperWindowsLayout; 
    $: layoutChanged(hwLayout);

    //~ stores
    let alertContent = '';

    const unsubscribe = alert.subscribe((value) => alertContent = value);

    const layoutChanged = (layout: HyperWindowsLayout) => {
        if (camera == undefined) { //~ not ready to show anything yet
            return;
        }

        if (layout == undefined) {
            console.log("layout is undefined");
            return;
        }

        if (layout.num != hyperWindows.length) {
            console.log("TODO: probably a new HW was added, but it wasn't reflected in the layout (" + layout.num + " vs " + hyperWindows.length + ")");
            return;
        }

        for (let [i, hw] of hyperWindows.entries()) {
            //~ TODO: there's got to be a better way: LayoutOptimizer -> HW.screenPosition -> HW.worldPosition (worldposition is what gets actually used in rendering
            //~ TODO: this is actually again wrong: the center of the bounding sphere is not the center (origin) of the model...but for now it's fine
            const hwPosition = new Vector2(layout.centers[i].x, layout.centers[i].y);
            hw.model.modelWorldPosition = unprojectToWorldSpace(screenToUV(hwPosition, canvasWidth, canvasHeight), camera);
        }
        hyperWindows = hyperWindows; // TODO: this is just temporary, for testing
    };

    const sizeChanged = (size: Size) => {
        canvasWidth = size.width;
        canvasHeight = size.height;

        $canvasSize = { width: size.width, height: size.height };
    };
    
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
        let hprWindow: HyperWindow | undefined = getHyperWindowAtPosition(x, y);

        if (hprWindow == undefined) return;

        const deltaX = x - lastMousePos.x;
        const deltaY = y - lastMousePos.y;
        const orbitingSpeed = 0.8;
        hprWindow.threeDView.rotationX += orbitingSpeed * deltaX;
        hprWindow.threeDView.rotationY += orbitingSpeed * deltaY;

        lastMousePos = { x: x, y: y };

        //~ adjust Matter.js body: Scale
        let [_, radius] = computeBoundingSphere(hprWindow, camera);
        // const currentRadius = hprWindow.currentRadius;
        const currentRadius = hwLayout.radii[hprWindow.id];
        const wantedRadius = radius;
        const scaleFactor = wantedRadius / currentRadius;
        // hprWindow.currentRadius = wantedRadius;

        //~ message back the optimizer to adjust bodies size
        needToScaleBodyForHyperWindow(hprWindow, scaleFactor);

        //~ adjust Matter.js body:  Position
        // const wantedPos = center;
        // const currentPos = new Vector2(b.position.x, b.position.y);
        // const offset = wantedPos.clone().sub(currentPos);

        // Matter.Body.translate(b, { x: offset.x, y: offset.y });
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
        let hprWindow: HyperWindow | undefined = getHyperWindowAtPosition(x, y);

        if (hprWindow == undefined) return;

        const zoomingSpeed = 0.001;
        hprWindow.threeDView.zoom += zoomingSpeed * delta;

        //~ adjust Matter.js body: Scale
        let [_, radius] = computeBoundingSphere(hprWindow, camera);
        const currentRadius = hwLayout.radii[hprWindow.id];
        const wantedRadius = radius;
        const scaleFactor = wantedRadius / currentRadius;
        // hprWindow.currentRadius = wantedRadius;

        //~ message back the optimizer to adjust bodies size
        needToScaleBodyForHyperWindow(hprWindow, scaleFactor);

        //~ adjust Matter.js body:  Position
        // const wantedPos = center;
        // const currentPos = new Vector2(b.position.x, b.position.y);
        // const offset = wantedPos.clone().sub(currentPos);

        // Matter.Body.translate(b, { x: offset.x, y: offset.y });

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
    });

    onDestroy(unsubscribe);

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

</script>

<T.PerspectiveCamera bind:ref={camera} makeDefault position={[0, 0, 50]} fov={24} />

<T.DirectionalLight castShadow position={[3, 10, 10]} />
<T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
<T.AmbientLight intensity={0.2} />

{#each hyperWindows as hw}
    <ModelPartWithInstancing model={hw.model} viewParams={hw.threeDView} hyperWindowId={hw.id} selections={hw.widget.selections} />
{/each}
