<script lang="ts">
    import { Vector2 } from "three";
    import { generateGrayScale } from "../../util";
    import SelectionWidget from "./SelectionWidget.svelte";
    import type { BoundingSphere, HWSelectionWidget, Selection, HyperWindow } from "$lib/hyperwindows-types";

    export let width: number;
    export let height: number;
    export let selectionWidgetThickness: number;
    export let newSelectionCallback: (
        ev: CustomEvent<{ selection: Selection; sourceWidget: HWSelectionWidget; sourceHW: HyperWindow }>,
    ) => void;

    export let widgets: HWSelectionWidget[];
    export let hyperWindows: HyperWindow[];
    export let boundingSpheres: BoundingSphere[];

    $: maxBinsNum = widgets.length > 0 ? widgets[0].binsNum : 0; //~ it should be that the first widget (= top level) has the most bins
    $: grayColorMap = generateGrayScale(maxBinsNum);
</script>

<div id="arc-selection-widget">
    <svg {width} {height} pointer-events="none">
        {#each widgets as widget, i}
            <SelectionWidget
                position={(i < boundingSpheres.length) ? new Vector2(
                    boundingSpheres[i].center.x - boundingSpheres[i].radius,
                    boundingSpheres[i].center.y - boundingSpheres[i].radius,
                ) : new Vector2()}
                width={100}
                height={100}
                widgetThickness={selectionWidgetThickness}
                N={widget.binsNum}
                colors={grayColorMap}
                colorForSelection={widget.colorForSelections}
                on:selectionFinished={newSelectionCallback}
                bind:selections={widget.selections}
                {widget}
                hyperWindow={hyperWindows[i]}
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
