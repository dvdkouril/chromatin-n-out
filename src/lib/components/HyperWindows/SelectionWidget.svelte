<script lang="ts">
    import { arc, pie } from "d3-shape";
    import { createEventDispatcher } from "svelte";
    import { isHoveredBin, nextDistinctColor } from "../../util";
    import type { Vector2 } from "three";
    import type { HWSelectionWidget, HyperWindow, Selection, SpatialSelection } from "$lib/hyperwindows-types";
    import { hoveredBin, spatialSelection } from "$lib/stores";

    const dispatch = createEventDispatcher();

    export let position: Vector2;
    export let N: number;
    export let width: number;
    export let height: number;
    export let widgetThickness = 25;
    export let selections: Selection[] = [];
    export let spatialSelections: SpatialSelection[] = [];
    export let widget: HWSelectionWidget;
    export let hyperWindow: HyperWindow;
    export let colorForSelection: string | null = null; //~ if this is null, generate new color; otherwise use this one
    export let colors: string[];

    $: bins = [...Array(N).fill(1)];
    $: radius = Math.min(width, height) / 2;

    const arcGen = arc();
    const arcGapAngle = 0.5; //~ in radians
    $: arcs = pie()
        .startAngle(arcGapAngle)
        .endAngle(2 * Math.PI - arcGapAngle)(bins);

    let selectionInProgress = false;
    // let hoveredBin: number | null = null;

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
        }),
    );

    //~ from list of connected bins for each spatial selection
    //~ from: [{bins: [...], connectedBins: [...]},...]
    //~ I want: [{start: 123, end: 123}, {start: ..., end: ...}]
    //~ basically also flatten
    $: spatialSelectionsProcessed = spatialSelections.map( sel => {
        let segments: {start: number; end: number}[] = [];
        for (const segment of sel.connectedBins) {
            if (segment.length > 0) {
                const first = segment[0];
                const last = segment[segment.length - 1];
                segments = [...segments, { start: first, end: last }];
            }
        }
        return segments;
    }).flat();
    
    $: spatialSelectionsArcs = spatialSelectionsProcessed.map((sel) =>
        arcGen({
            innerRadius: radius - widgetThickness,
            outerRadius: radius,
            startAngle: arcs[sel.start].startAngle,
            endAngle: arcs[sel.end].endAngle,
        }),
    );

    $: selectionColorArc = arcGen({
        innerRadius: radius - widgetThickness,
        outerRadius: radius,
        startAngle: -arcGapAngle,
        endAngle: arcGapAngle,
    });

    // const widgetColorFromParent = "#ff0000";

    const mouseOvered = (event: MouseEvent) => {
        if (event.target == undefined) {
            return;
        }
        if (event.target instanceof Element) {
            const hovered = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
            $hoveredBin = { binId: hovered, hwId: hyperWindow.id};
            //~ multiple selections version
            if (selectionInProgress) {
                const binId = hovered; 
                const activeSelection = selections.slice(-1)[0];
                const selectionsMinusLast = selections.slice(0, selections.length - 1);
                //~ figure out which direction the selection is
                if (binId < activeSelection.start) {
                    selections = [...selectionsMinusLast, { ...activeSelection, start: binId }];
                } else {
                    selections = [...selectionsMinusLast, { ...activeSelection, end: binId }];
                }
            }
        }
    };

    const mouseOut = (_: MouseEvent) => {
        $hoveredBin = undefined;
    };

    const mouseDown = (event: MouseEvent) => {
        if (event.target == undefined) {
            return;
        }
        if (event.target instanceof Element) {
            console.log("Selection started.");
            const binId = event.target.id.split("-")[1];
            const selColor =
                colorForSelection == null || colorForSelection == "" ? nextDistinctColor(selections.length) : colorForSelection;
            selections.push({
                start: parseInt(binId),
                end: parseInt(binId),
                color: selColor,
            });
            selectionInProgress = true;
        }
    };

    const mouseUp = (_: MouseEvent) => {
        //~ => selection finished
        console.log("Selection ended.");
        selectionInProgress = false;
        dispatch("selectionFinished", {
            selection: selections.slice(-1)[0],
            sourceWidget: widget,
            sourceHW: hyperWindow,
        });
    };

    const touchStart = (event: TouchEvent) => {
        console.log("touch start.");
        switch (event.touches.length) {
            case 1:
                if (event.target == undefined) {
                    break;
                }
                if (event.target instanceof Element) {
                    const binId = event.target.id.split("-")[1];
                    const selColor =
                        colorForSelection == null || colorForSelection == "" ? nextDistinctColor(selections.length) : colorForSelection;
                    selections.push({ start: parseInt(binId), end: parseInt(binId), color: selColor });
                    selectionInProgress = true;
                }
                break;
            // case 2: break;
            default:
                break;
        }
    };
    const touchEnd = (_: TouchEvent) => {
        //~ => selection finished
        console.log("touch end.");
        selectionInProgress = false;
        dispatch("selectionFinished", {
            selection: selections.slice(-1)[0],
            // sourceWidget: widgetId,
            sourceWidget: widget,
        });
    };
    const touchMove = (event: TouchEvent) => {
        console.log("touch move");
        event.preventDefault();
        event.stopPropagation();
        const firstTouch = event.touches[0];
        const elUnderTouch = document.elementFromPoint(firstTouch.clientX, firstTouch.clientY);
        if (elUnderTouch == null) {
            return;
        }
        const hovered = parseInt(elUnderTouch.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
        $hoveredBin = { binId: hovered, hwId: hyperWindow.id};
        //~ multiple selections version
        if (selectionInProgress) {
            console.log("hoveredBin:" + hovered);
            const binId = hovered; //~ this is bit of a weird solution...maybe fix later
            const activeSelection = selections.slice(-1)[0];
            const selectionsMinusLast = selections.slice(0, selections.length - 1);
            //~ figure out which direction the selection is
            if (binId < activeSelection.start) {
                selections = [...selectionsMinusLast, { ...activeSelection, start: binId }];
            } else {
                selections = [...selectionsMinusLast, { ...activeSelection, end: binId }];
            }
        }
    };
</script>

<!-- Color arc indicating association with parent HW's selection -->
<path
    d={selectionColorArc}
    id={"parent-selection-" + widget.id}
    fill={widget.colorForSelections}
    pointer-events="none"
    transform={"translate(" + position.x + "," + position.y + ")"}
/>
<!-- Info about # of bins or the hovered bin -->
<text x={position.x - 10} y={position.y - radius + 20} fill="#ffffff" font-family="sans-serif">
    {(($hoveredBin) && (hyperWindow.id == $hoveredBin.hwId)) ? $hoveredBin.binId : "#" + N.toString() }
</text>
<!-- Individual segments of the selection widget -->
{#each segments as bin, i}
    <path
        d={bin}
        id={"bin-" + i}
        fill={isHoveredBin($hoveredBin, i, hyperWindow.id) ? "red" : colors[i]}
        fill-opacity={isHoveredBin($hoveredBin, i, hyperWindow.id) ? 1.0 : 0.3}
        pointer-events="all"
        transform={"translate(" + position.x + "," + position.y + ")"}
        on:mousedown={mouseDown}
        on:mouseup={mouseUp}
        on:mouseover={mouseOvered}
        on:mouseout={mouseOut}
        on:touchstart={touchStart}
        on:touchend={touchEnd}
        on:touchmove={touchMove}
        on:focus={() => {}}
        on:blur={() => {}}
        role="none"
    />
{/each}
<!-- Selection indication overlay -->
{#if selections.length > 0}
    {#each selectionsArcs as selArc, i}
        <path
            d={selArc}
            id={"selection-arc-" + i}
            style="stroke-width: 5px; stroke: {selections[i].color}; fill: none; pointer-events:none"
            transform={"translate(" + position.x + "," + position.y + ")"}
        />
    {/each}
{/if}
<!-- Spatial Selections indication overlay -->
{#if spatialSelections.length > 0}
    {#each spatialSelectionsArcs as selArc, i}
        <path
            d={selArc}
            id={"spatial-selection-arc-" + i}
            style="stroke-width: 5px; stroke: yellow; fill: none; pointer-events:none"
            transform={"translate(" + position.x + "," + position.y + ")"}
        />
    {/each}
{/if}
