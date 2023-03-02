<script lang="ts">
    import * as d3 from "d3";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let width;
    export let height;
    export let N;

    $: pieceSize = width / bins.length;
    $: bins = [...Array(N).keys()];
    $: binColors = generateColors(N);

    let selectionInProgress = false;
    // let selection = { start: 5, end: 10 };
    let selection = null;
    let widgetId = 0;
    // let bins = d3.range();
    // let bins = [ 1, 2, 3, 4, 5, 6];

    const generateColors = (numOfColors) => {
        let colors = undefined;
        if (colors === undefined) {
            colors = d3.schemeSpectral[numOfColors];
        }
        if (colors === undefined) {
            colors = d3.quantize(
                (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
                numOfColors
            );
        }

        // const color = d3.scaleOrdinal(bins, colors); //todo: do i need to grab bins from outside of local scope?
        // console.log("bin colors:");
        // console.log(color);
        // return color;
        return colors;
    };

    const colorOrSelection = (binId) => {
        if (isInSelection(binId)) {
            return "blue";
        } else {
            return binColors[binId];
        }
    };

    const isInSelection = (binId) => {
        if (selection === null) return false;

        if (binId >= selection.start && binId < selection.end) {
            return true;
        }
    };

    const mouseOvered = (event) => {
        if (selectionInProgress) {
            const binId = event.target.id.split("-")[1];
            selection = { ...selection, end: parseInt(binId) };
        }
    };

    const mouseDown = (event) => {
        const binId = event.target.id.split("-")[1];
        selection = { start: parseInt(binId), end: parseInt(binId) };
        selectionInProgress = true;
    };

    const mouseUp = (event) => {
        //~ => selection finished
        selectionInProgress = false;
        console.log("notifying parent");
        console.log(selection);
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
                style="fill:{binColors[i]}"
            />
        {/each}
        <!-- Selection indication overlay -->
        {#if selection != null}
        <rect
            x={0 + selection.start * pieceSize}
            y={0}
            width={(selection.end - selection.start) * pieceSize}
            {height}
            style="fill:blue"
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
