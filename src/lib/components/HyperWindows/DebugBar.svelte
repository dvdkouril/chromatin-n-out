<script lang="ts">
    import { WidgetStyle } from "../../hyperwindows-types";
    import { hoveredHyperWindowId } from "$lib/stores";

    //~ General settings
    export let showMatterDebug: boolean;
    export let showBoundingSphereDebug: boolean;
    export let widgetDesign: WidgetStyle;
    export let showAllWidgets: boolean;

    //~ Dataset selectbox
    export let onChangeCallback: () => any;
    export let exampleScenes: { id: number, name: string }[];
    export let selectedScene: { id: number; name: string };
</script>

<div id="debug-bar">
    <button on:click={() => (showMatterDebug = !showMatterDebug)}
        >{showMatterDebug ? "~on~" : "-off-"}</button
    >
    <button
        on:click={() => (showBoundingSphereDebug = !showBoundingSphereDebug)}
        >{showBoundingSphereDebug ? "~on~" : "-off-"}</button
    >
    <span>
        widget style:
    </span>
    <button on:click={() => (widgetDesign = WidgetStyle.Boundary)}>~1~</button>
    <button on:click={() => (widgetDesign = WidgetStyle.SmallTopLeft)}
        >~2~</button
    >
    <button on:click={() => (showAllWidgets = true)}>show all</button>
    <button on:click={() => (showAllWidgets = false)}>show hovered</button>
    <select bind:value={selectedScene} on:change={onChangeCallback}>
        {#each exampleScenes as scene}
            <option value={scene}>
                {scene.name}
            </option>
        {/each}
    </select>
    <span>
        Hovered HyperWindow: {$hoveredHyperWindowId}.
    </span>
</div>

<style>
#debug-bar {
    color: white; 
    font-family:Arial, Helvetica, sans-serif;
}
</style>
