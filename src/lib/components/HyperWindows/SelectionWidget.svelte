<script lang="ts">
    import { arc, pie } from "d3-shape";
    import { createEventDispatcher } from "svelte";
    import { randomNiceColor } from "../../util";
    import type { Vector2 } from "three";
    import type { HWSelectionWidget, Selection } from "$lib/hyperwindows-types";

    const dispatch = createEventDispatcher();

    export let position: Vector2;
    export let N: number;
    export let width: number;
    export let height: number;
    export let widgetThickness = 25;
    export let selections: Selection[] = [];
    export let widget: HWSelectionWidget;
    export let colorForSelection: string | null = null; //~ if this is null, generate new color; otherwise use this one
    export let colors: string[];

    $: bins = [...Array(N).fill(1)];
    $: radius = Math.min(width, height) / 2;

    const arcGen = arc();
    $: arcs = pie()(bins);

    let selectionInProgress = false;
    let hoveredBin: number | null = null;

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

    const mouseOvered = (event: MouseEvent) => {
        if (event.target == undefined) {
            return;
        }
        if (event.target instanceof Element) {
            hoveredBin = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
            //~ multiple selections version
            if (selectionInProgress) {
                const binId = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
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

    const mouseOut = (event: MouseEvent) => {
        hoveredBin = null;
    };

    const mouseDown = (event: MouseEvent) => {
        if (event.target == undefined) {
            return;
        }
        if (event.target instanceof Element) {
            console.log("Selection started.");
            const binId = event.target.id.split("-")[1];
            const selColor = (colorForSelection == null) || (colorForSelection == "") ? randomNiceColor() : colorForSelection;
            selections.push({
                start: parseInt(binId),
                end: parseInt(binId),
                color: selColor,
            });
            selectionInProgress = true;
        }
    };

    const mouseUp = (event: MouseEvent) => {
        //~ => selection finished
        console.log("Selection ended.");
        selectionInProgress = false;
        dispatch("selectionFinished", {
            selection: selections.slice(-1)[0],
            // sourceWidget: widgetId,
            sourceWidget: widget,
        });
    };

    const touchStart = (event: TouchEvent) => {
		console.log('touch start.');
		switch (event.touches.length) {
			case 1:
				if (event.target == undefined) {
					break;
				}
				if (event.target instanceof Element) {
					const binId = event.target.id.split('-')[1];
					const selColor = (colorForSelection == null) || (colorForSelection == "") ? randomNiceColor() : colorForSelection;
					selections.push({ start: parseInt(binId), end: parseInt(binId), color: selColor });
					selectionInProgress = true;
				}
				break;
			// case 2: break;
			default:
				break;
		}
	};
    const touchEnd = (event: TouchEvent) => {
		//~ => selection finished
		console.log('touch end.');
		selectionInProgress = false;
		dispatch('selectionFinished', {
			selection: selections.slice(-1)[0],
			// sourceWidget: widgetId,
			sourceWidget: widget
		});
	};
    const touchMove = (event: TouchEvent) => {
		console.log('touch move');
		event.preventDefault();
		event.stopPropagation();
        const firstTouch = event.touches[0];
        const elUnderTouch = document.elementFromPoint(firstTouch.clientX, firstTouch.clientY);
        if (elUnderTouch == null) {
            return;
        }
		hoveredBin = parseInt(elUnderTouch.id.split('-')[1]); //~ this is bit of a weird solution...maybe fix later
		//~ multiple selections version
		if (selectionInProgress) {
			console.log('hoveredBin:' + hoveredBin);
			const binId = parseInt(elUnderTouch.id.split('-')[1]); //~ this is bit of a weird solution...maybe fix later
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
