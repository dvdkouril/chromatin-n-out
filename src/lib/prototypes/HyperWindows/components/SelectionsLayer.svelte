<script lang="ts">
    import { generateGrayScale } from "../../../util";
    import type { Widget } from "../../../widget";
    import SelectionWidget from "./SelectionWidget.svelte";

    export let width;
    export let height;
    // export let widget;
    export let hyperWindowSize;
    export let selectionWidgetThickness;
    export let newSelectionCallback;
    // export let selectionsColormap;
    // export let colorForSelection;
    // export let bins;

    let hoveredBin: number = null;

    // $: grayColorMap = generateGrayScale(bins.length);
    $: grayColorMap = generateGrayScale(100);

    /**
     * What do I want to do here:
     * - keep a list of the selection widgets (computed from a list of bounding sphere positions)
     */
    export let selectionWidgets: Widget[] = [];
</script>

<div id="arc-selection-widget">
    <svg
        {width}
        {height}
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
        pointer-events="none"
    >
        {#each selectionWidgets as widget}
            <SelectionWidget
                width={100}
                height={100}
                widgetThickness={selectionWidgetThickness}
                N={widget.binsNum}
                colors={grayColorMap}
                colorForSelection={widget.colorForSelections}
                on:selectionFinished={newSelectionCallback}
                bind:selections={widget.selections}
                {widget}
                bind:hoveredBin
            />
        {/each}
    </svg>
</div>

<style>
    #arc-selection-widget {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 2;
        pointer-events: none;
    }
</style>
