<script lang="ts">
    import ArcSelectionWidget from "./ArcSelectionWidget.svelte";
    import SampleScene from "./SampleScene.svelte";
    import { fade } from 'svelte/transition';
    import { generateGrayScale } from "../util";

    export let widget;
    export let hyperWindowSize;
    export let selectionWidgetThickness;
    export let newSelectionCallback;
    // export let selectionsColormap;
    export let colorForSelection;
    export let bins;

    let hoveredBin: number = null;

//   $: grayColorMap = generateGrayScale(topLevelBinsNum);
  $: grayColorMap = generateGrayScale(bins.length);
//   $: selectionColorsRange = selectionsColormap.slice(widget.domain.start, widget.domain.end);
</script>

<div
    class="widget-3d-combo"
    style="display: block; width: 100%; height: 100%, position: relative;"
>
<!-- <div
    transition:fade={{ duration: 2000 }}
    class="widget-3d-combo"
    style="display: block; width: 100%; height: 100%, position: relative;"
> -->
    <!-- TODO: extract into HyperWindow component -->
    <ArcSelectionWidget
        width={hyperWindowSize}
        height={hyperWindowSize}
        widgetThickness={selectionWidgetThickness}
        N={widget.binsNum}
        colors={grayColorMap}
        {colorForSelection}
        on:selectionFinished={newSelectionCallback}
        bind:selections={widget.selections}
        widget={widget}
        bind:hoveredBin={hoveredBin}
    />
    <SampleScene
        width={hyperWindowSize - 2 * selectionWidgetThickness}
        height={hyperWindowSize - 2 * selectionWidgetThickness}
        offset={selectionWidgetThickness}
        spheres={bins}
        bind:selections={widget.selections}
        bind:hoveredBin={hoveredBin}
    />
</div>

<!-- <div style="width: 250px; height: 250px; background-color: red;">

</div> -->
