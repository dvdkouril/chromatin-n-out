<script lang="ts">
    import { Vector2 } from "three";
    import type { HWSelectionWidget } from "../../hyperwindows-types";
    import { generateGrayScale } from "../../util";
    import SelectionWidget from "./SelectionWidget.svelte";

    export let width: number;
    export let height: number;
    export let selectionWidgetThickness: number;
    export let newSelectionCallback;

    // let hoveredBin: number = null;

    $: maxBinsNum = widgetsAndPositionsAndRadii.length > 0 ? widgetsAndPositionsAndRadii[0][0].binsNum : 0;
    $: grayColorMap = generateGrayScale(maxBinsNum);
   
    export let widgetsAndPositionsAndRadii: [HWSelectionWidget, Vector2, number][];

</script>

<div id="arc-selection-widget">
    <svg
        {width}
        {height}
        pointer-events="none"
    >
        {#each widgetsAndPositionsAndRadii as [widget, screenPosition, radius]}
            <SelectionWidget
                position={new Vector2(screenPosition.x - radius, screenPosition.y - radius)}
                width={100}
                height={100}
                widgetThickness={selectionWidgetThickness}
                N={widget.binsNum}
                colors={grayColorMap}
                colorForSelection={widget.colorForSelections}
                on:selectionFinished={newSelectionCallback}
                bind:selections={widget.selections}
                {widget}
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
