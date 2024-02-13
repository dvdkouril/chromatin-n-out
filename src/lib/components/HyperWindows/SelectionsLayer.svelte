<script lang="ts">
    import { Vector2 } from "three";
    import { generateGrayScaleColorMaps } from "../../util";
    import SelectionWidget from "./SelectionWidget.svelte";
    import { WidgetStyle } from "$lib/hyperwindows-types";
    import type {
        HyperWindowsLayout, 
        HWSelectionWidget,
        HyperWindow,
    } from "$lib/hyperwindows-types";
    import { hoveredHyperWindowId } from "$lib/stores";

    export let width: number;
    export let height: number;
    const selectionWidgetThickness = 25;

    export let widgets: HWSelectionWidget[];
    export let hyperWindows: HyperWindow[]; //~ TODO: this is really only sent to the Widget (for the new selection callback)...there's probably a better way
    export let layout: HyperWindowsLayout;
    export let rootModelSizes: number[];

    export let widgetDesign: WidgetStyle = WidgetStyle.SmallTopLeft;
    export let showingAllWidgets: boolean;

    $: colorMaps = generateGrayScaleColorMaps(rootModelSizes);
    // $: widgetShown = widgets.map(w => w);

    const computeWidgetThickness = (radius: number): number => {
        const percentage = 20;
        return (percentage * 0.01) * radius;
    };

    const getWidgetThicknessBasedOnStyle = (style: WidgetStyle, radius: number): number => {
        switch (style) {
            case WidgetStyle.SmallTopLeft:
                return selectionWidgetThickness;

            case WidgetStyle.Boundary:
                return computeWidgetThickness(radius);

            default:
                return selectionWidgetThickness;
        }
    };

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
                return radius * 2;

            default:
                return radius;
        }
    };

    const shouldShouldWidget = (widgetId: number, hoveredHW: number | undefined): boolean => {
        const shownWidgetId = hoveredHW;
        console.log("widgetId = " + widgetId);
        if (!shownWidgetId) {
            false;
        }
        if (widgetId == shownWidgetId) {
            return true;
        }
        return false;
    }
</script>

<div id="arc-selection-widget">
    <svg {width} {height} pointer-events="none">
        {#if layout.num == widgets.length }
            {#each widgets as widget, i}
                {#if showingAllWidgets || shouldShouldWidget(widget.id, $hoveredHyperWindowId) }
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
                        widgetThickness={getWidgetThicknessBasedOnStyle(widgetDesign, layout.radii[i])}
                        N={widget.binsNum}
                        colors={colorMaps[widget.treeId]}
                        colorForSelection={widget.colorForSelections}
                        on:selectionFinished
                        bind:selections={widget.selections}
                        {widget}
                        hyperWindow={hyperWindows[i]}
                    />
                {/if}
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
