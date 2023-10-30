<script lang="ts">
    import { arc, pie } from "d3-shape";
    import { createEventDispatcher } from "svelte";
    import { randomNiceColor } from "../../../util";

    const dispatch = createEventDispatcher();

    export let position;
    export let N;
    export let width;
    export let height;
    export let widgetThickness = 25;
    export let selections = [];
    export let widget;
    export let colorForSelection = null; //~ if this is null, generate new color; otherwise use this one
    export let colors;

    $: bins = [...Array(N).fill(1)];
    $: radius = Math.min(width, height) / 2;

    const arcGen = arc();
    $: arcs = pie()(bins);

    let selectionInProgress = false;
    export let hoveredBin = null;

    $: segments = arcs.map((arc) => {
        let input = {
            innerRadius: radius - widgetThickness,
            outerRadius: radius,
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
        };
        return arcGen(input);
    });

    $: selectionsArcs = selections.map((sel) =>
        arcGen({
            innerRadius: radius - widgetThickness,
            outerRadius: radius,
            startAngle: arcs[sel.start].startAngle,
            endAngle: arcs[sel.end].endAngle,
        })
    );

    const mouseOvered = (event) => {
        hoveredBin = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
        //~ multiple selections version
        if (selectionInProgress) {
            const binId = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
            const activeSelection = selections.slice(-1)[0];
            const selectionsMinusLast = selections.slice(
                0,
                selections.length - 1
            );
            //~ figure out which direction the selection is
            if (binId < activeSelection.start) {
                selections = [
                    ...selectionsMinusLast,
                    { ...activeSelection, start: binId },
                ];
            } else {
                selections = [
                    ...selectionsMinusLast,
                    { ...activeSelection, end: binId },
                ];
            }
        }
    };

    const mouseOut = (event) => {
        hoveredBin = null;
    };

    const mouseDown = (event) => {
        console.log("Selection started.");
        const binId = event.target.id.split("-")[1];
        const selColor =
            colorForSelection == null ? randomNiceColor() : colorForSelection;
        selections.push({
            start: parseInt(binId),
            end: parseInt(binId),
            color: selColor,
        });
        selectionInProgress = true;
    };

    const mouseUp = (event) => {
        //~ => selection finished
        console.log("Selection ended.");
        selectionInProgress = false;
        dispatch("selectionFinished", {
            selection: selections.slice(-1)[0],
            // sourceWidget: widgetId,
            sourceWidget: widget,
        });
    };
</script>

{#each segments as bin, i}
    <path
        d={bin}
        id={"bin-" + i}
        fill={i == hoveredBin ? "red" : colors[i]}
        pointer-events="all"
        transform={"translate(" + position.x + "," + position.y + ")"}
        on:mousedown={mouseDown}
        on:mouseup={mouseUp}
        on:mouseover={mouseOvered}
        on:mouseout={mouseOut}
        on:focus={() => {}}
        on:blur={() => {}}
    />
{/each}
<!-- Selection indication overlay -->
{#if selections.length > 0}
    {#each selectionsArcs as selArc, i}
        <path
            d={selArc}
            id={"selection-arc-" + i}
            style="stroke-width: 5px; stroke: {selections[i]
                .color}; fill: none; pointer-events:none"
            transform={"translate(" + position.x + "," + position.y + ")"}
        />
    {/each}
{/if}
