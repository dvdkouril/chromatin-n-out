<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { arc, pie } from "d3-shape";
    import { randomNiceColor } from "../util";

    const dispatch = createEventDispatcher();

    export let width;
    export let height;
    export let N;
    export let widgetId;
    export let colors;
    // export let selection = null;
    export let selections = [];
    // export let selectionColor;

    let selectionInProgress = false;

    $: pieceSize = width / bins.length;
    // $: bins = [...Array(N).keys()];
    $: bins = [...Array(N).fill(1)];

    $: radius = Math.min(width, height) / 2;
    export let widgetThickness = 25;

    const arcGen = arc();
    $: arcs = pie()(bins);

    $: segments = arcs.map((arc) => {
        let input = {
            // innerRadius: 50,
            innerRadius: radius - widgetThickness,
            // outerRadius: 100,
            outerRadius: radius,
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
        };
        return arcGen(input);
    });

    // $: selectionArc = (selection != null) ?
    //     arcGen({
    //         innerRadius: radius - widgetThickness,
    //         outerRadius: radius,
    //         startAngle: arcs[selection.start].startAngle,
    //         endAngle: arcs[selection.end].endAngle,
    //         // startAngle: 0,
    //         // endAngle: Math.PI / 4, // radians
    //     }) : "";

    $: selectionsArcs = selections.map((sel) => arcGen({
            innerRadius: radius - widgetThickness,
            outerRadius: radius,
            startAngle: arcs[sel.start].startAngle,
            endAngle: arcs[sel.end].endAngle,
        }));
    // $: selectionsArcs = (selections.length > 0) ?
    //     arcGen({
    //         innerRadius: radius - widgetThickness,
    //         outerRadius: radius,
    //         startAngle: arcs[selection.start].startAngle,
    //         endAngle: arcs[selection.end].endAngle,
    //     }) : "";

    const mouseOvered = (event) => {
        // if (selectionInProgress) {
        //     const binId = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
        //     //~ figure out which direction the selection is
        //     if (binId < selection.start) {
        //         selection = { ...selection, start: binId };
        //     } else {
        //         selection = { ...selection, end: binId };
        //     }
        // }
        //~ multiple selections version
        if (selectionInProgress) {
            const binId = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
            const lastIndex = selections.length - 1;
            const activeSelection = selections.slice(-1)[0];
            const selectionsMinusLast = selections.slice(0, selections.length - 1);
            //~ figure out which direction the selection is
            if (binId < activeSelection.start) {
                // selections[lastIndex] = { ...activeSelection, start: binId };
                selections = [...selectionsMinusLast, {...activeSelection, start: binId}];
            } else {
                // selections[lastIndex] = { ...activeSelection, end: binId };
                selections = [...selectionsMinusLast, {...activeSelection, end: binId}];
            }
        }
    };

    const mouseDown = (event) => {
        console.log("Selection started.");
        const binId = event.target.id.split("-")[1];
        // selection = { start: parseInt(binId), end: parseInt(binId) };
        const selColor = randomNiceColor();
        selections.push({ start: parseInt(binId), end: parseInt(binId), color: selColor });
        selectionInProgress = true;
    };

    const mouseUp = (event) => {
        //~ => selection finished
        console.log("Selection ended.");
        // console.log("selections:");
        // console.log(selections);
        selectionInProgress = false;
        dispatch("selectionFinished", {
            // selection: selection,
            selection: selections.slice(-1)[0],
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

<div id="arc-selection-widget" 
    style="position: absolute; z-index: 2; pointer-events: none"
>
    <!-- <svg {width} {height}> -->
    <svg
        {width}
        height={height}
        viewBox={`${-width/2} ${-height/2} ${width} ${height}`}
        pointer-events="none"     
    >
        {#each segments as bin, i}
            <path
                d={bin}
                id={"bin-" + i}
                fill={colors[i]}
                pointer-events="all"
                on:mousedown={mouseDown}
                on:mouseup={mouseUp}
                on:mouseover={mouseOvered}
                on:focus={() => {}}
            />
        {/each}
        <!-- Selection indication overlay -->
        <!-- {#if selection != null}
            <path
                d={selectionArc}
                id={"selection-arc"}
                style="stroke-width: 5px; stroke: {selectionColor}; fill: none; pointer-events:none"
            /> 
        {/if} -->
        {#if selections.length > 0}
            {#each selectionsArcs as selArc, i}
                <path
                    d={selArc}
                    id={"selection-arc-" + i}
                    style="stroke-width: 5px; stroke: {selections[i].color}; fill: none; pointer-events:none"
                />
            {/each}
        {/if}
    </svg>
    <!-- {#if selections.length > 0}
    <p>
        Selections: {selections.map((sel) => { return "[" + sel.start.toString() + " - " + sel.end.toString() + "]"})}
    </p>
    {/if} -->
</div>
