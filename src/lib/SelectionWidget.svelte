<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let width;
    export let height;
    export let N;
    export let colors;
    export let widgetId;

    $: pieceSize = width / bins.length;
    $: bins = [...Array(N).keys()];

    let selectionInProgress = false;
    let selection = null;
    // let widgetId = 0;
    
    const isInSelection = (binId) => {
        if (selection === null) return false;

        if (binId >= selection.start && binId < selection.end) {
            return true;
        }
    };

    const mouseOvered = (event) => {
        if (selectionInProgress) {
            const binId = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
            //~ figure out which direction the selection is
            if (binId < selection.start) {
                selection = { ...selection, start: binId}
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
</script>

<div id="widget">
    <svg {width} {height}>
        <!-- todo: viewbox and background -->
        {#each bins as bin, i}
            <!-- first version: just rectangles (to make it simpler) -->
            <rect
                id={"bin-" + i}
                x={0 + i * pieceSize}
                y={0}
                width={pieceSize}
                {height}
                on:mousedown={mouseDown}
                on:mouseup={mouseUp}
                on:mouseover={mouseOvered}
                on:focus={() => {}}
                style="fill:{colors[i]}"
            />
        {/each}
        <!-- Selection indication overlay -->
        {#if selection != null}
        <rect
            x={0 + selection.start * pieceSize}
            y={0}
            width={(selection.end - selection.start) * pieceSize}
            {height}
            style="stroke-width: 5px; stroke: blue; fill: none; pointer-events:none"
        />
        {/if}
    </svg>
    <!-- Debug info: -->
    {#if selection != null}
    <p>
        Selection: {selection.start} - {selection.end}
    </p>
    <p>
        Selection in progress: {selectionInProgress
            ? String.fromCodePoint(0x2705)
            : String.fromCodePoint(0x274c)}
    </p>
    {/if}
</div>
