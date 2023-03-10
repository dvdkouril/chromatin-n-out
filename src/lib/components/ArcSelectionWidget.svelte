<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { arc, pie } from "d3-shape";

    const dispatch = createEventDispatcher();

    export let width;
    export let height;
    export let N;
    export let widgetId;
    export let colors;
    export let selection = null;

    let selectionInProgress = false;

    $: pieceSize = width / bins.length;
    // $: bins = [...Array(N).keys()];
    $: bins = [...Array(N).fill(1)];

    const arcGen = arc();

    // $: arcPath = arcGen({
    //     innerRadius: 0,
    //     outerRadius: 100,
    //     startAngle: 0,
    //     endAngle: Math.PI / 4, // radians
    // });

    $: arcs = pie()(bins);

    $: segments = arcs.map((arc) => {
        let input = {
            innerRadius: 50,
            outerRadius: 100,
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
        };
        return arcGen(input);
    });

    $: selectionArc = (selection != null) ?
        arcGen({
            innerRadius: 50,
            outerRadius: 100,
            startAngle: arcs[selection.start].startAngle,
            endAngle: arcs[selection.end].endAngle,
            // startAngle: 0,
            // endAngle: Math.PI / 4, // radians
        }) : "";

    const mouseOvered = (event) => {
        if (selectionInProgress) {
            const binId = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
            //~ figure out which direction the selection is
            if (binId < selection.start) {
                selection = { ...selection, start: binId };
            } else {
                selection = { ...selection, end: binId };
            }
        }
    };

    const mouseDown = (event) => {
        const binId = event.target.id.split("-")[1];
        selection = { start: parseInt(binId), end: parseInt(binId) };
        selectionInProgress = true;
    };

    const mouseUp = (event) => {
        //~ => selection finished
        console.log("mouse UP");
        selectionInProgress = false;
        dispatch("selectionFinished", {
            selection: selection,
            sourceWidget: widgetId,
        });
    };

// viewBox={"[" +
//             -width / 2 +
//             ", " +
//             -height / 2 +
//             ", " +
//             width +
//             ", " +
//             height +
//             "]"}
</script>

<div id="arc-selection-widget">
    <!-- <svg {width} {height}> -->
    <svg
        {width}
        height={height}
        viewBox={`${-width/2} ${-height/2} ${width} ${height}`}
    >
        {#each segments as bin, i}
            <path
                d={bin}
                id={"bin-" + i}
                fill={colors[i]}
                on:mousedown={mouseDown}
                on:mouseup={mouseUp}
                on:mouseover={mouseOvered}
                on:focus={() => {}}
            />
        {/each}
        <!-- Selection indication overlay -->
        {#if selection != null}
            <path
                d={selectionArc}
                id={"selection-arc"}
                style="stroke-width: 5px; stroke: blue; fill: none; pointer-events:none"
            />
            <!-- <rect
                    x={0 + selection.start * pieceSize}
                    y={0}
                    width={(selection.end - selection.start) * pieceSize}
                    {height}
                    style="stroke-width: 5px; stroke: blue; fill: none; pointer-events:none"
                /> -->
        {/if}
    </svg>
</div>
