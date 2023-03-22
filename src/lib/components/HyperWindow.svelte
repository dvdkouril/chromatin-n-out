<script lang="ts">
    import ArcSelectionWidget from "./ArcSelectionWidget.svelte";
    import SampleScene from "./SampleScene.svelte";
    import { fade } from 'svelte/transition';
    import { generateGrayScale } from "../util";

    export let widget;
    export let hyperWindowSize;
    export let selectionWidgetThickness;
    export let newSelectionCallback;
    export let bins;

//   $: grayColorMap = generateGrayScale(topLevelBinsNum);
  $: grayColorMap = generateGrayScale(bins.length);
</script>

<div
    transition:fade={{ duration: 2000 }}
    class="widget-3d-combo"
    style="display: block; width: 100%; height: 100%, position: relative;"
>
    <!-- TODO: extract into HyperWindow component -->
    <ArcSelectionWidget
        width={hyperWindowSize}
        height={hyperWindowSize}
        widgetThickness={selectionWidgetThickness}
        N={widget.binsNum}
        colors={grayColorMap}
        widgetId={widget.id}
        on:selectionFinished={newSelectionCallback}
        bind:selections={widget.selections}
    />
    <SampleScene
        width={hyperWindowSize - 2 * selectionWidgetThickness}
        height={hyperWindowSize - 2 * selectionWidgetThickness}
        offset={selectionWidgetThickness}
        spheres={bins}
        bind:selections={widget.selections}
    />
</div>

<!-- <div style="width: 250px; height: 250px; background-color: red;">

</div> -->
