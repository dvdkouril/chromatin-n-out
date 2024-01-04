<script lang="ts">
    import { Vector2 } from "three";
    import { generateGrayScale } from "../../util";
    import SelectionWidget from "./SelectionWidget.svelte";
    import { WidgetStyle } from "$lib/hyperwindows-types";
    import type {
        HyperWindowsLayout, 
        HWSelectionWidget,
        Selection,
        HyperWindow,
    } from "$lib/hyperwindows-types";

    export let width: number;
    export let height: number;
    export let selectionWidgetThickness: number;
    export let newSelectionCallback: (
        ev: CustomEvent<{
            selection: Selection;
            sourceWidget: HWSelectionWidget;
            sourceHW: HyperWindow;
        }>,
    ) => void;

    export let widgets: HWSelectionWidget[];
    export let hyperWindows: HyperWindow[];
    export let layout: HyperWindowsLayout;

    export let widgetDesign: WidgetStyle = WidgetStyle.SmallTopLeft;

    $: maxBinsNum = widgets.length > 0 ? widgets[0].binsNum : 0; //~ it should be that the first widget (= top level) has the most bins
    $: grayColorMap = generateGrayScale(maxBinsNum); //~ the colormap is generated for each HW tree, subsequent HWs only get subparts

    const getPositionBasedOnStyle = (
        style: WidgetStyle,
        position: Vector2,
        radius: number,
    ): Vector2 => {
        switch (style) {
            case WidgetStyle.SmallTopLeft:
                return new Vector2(position.x - radius, position.y - radius);

            case WidgetStyle.Boundary:
                return new Vector2(position.x, position.y);

            default:
                return position;
        }
    };

    const getSizeBasedOnStyle = (
        style: WidgetStyle,
        radius: number,
    ): number => {
        switch (style) {
            case WidgetStyle.SmallTopLeft:
                return 100;

            case WidgetStyle.Boundary:
                return radius * 2 * 1.1;

            default:
                return radius;
        }
    };
</script>

<div id="arc-selection-widget">
    <svg {width} {height} pointer-events="none">
        {#if layout.num == widgets.length }
            {#each widgets as widget, i}
                <SelectionWidget
                    position={getPositionBasedOnStyle(
                        widgetDesign,
                        layout.centers[i],
                        layout.radii[i],
                    )}
                    width={getSizeBasedOnStyle(
                        widgetDesign,
                        layout.radii[i],
                    )}
                    height={getSizeBasedOnStyle(
                        widgetDesign,
                        layout.radii[i],
                    )}
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
        {:else}
            ERROR: less widgets than boundingSpheres
        {/if}
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
