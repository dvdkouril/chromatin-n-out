<script lang="ts">
    import { WidgetStyle } from "../../hyperwindows-types";

    //~ General settings
    export let showMatterDebug: boolean;
    export let showBoundingSphereDebug: boolean;
    export let widgetDesign: WidgetStyle;

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
    <span style="color: white; font-family:Arial, Helvetica, sans-serif"
        >widget style:
    </span>
    <button on:click={() => (widgetDesign = WidgetStyle.Boundary)}>~1~</button>
    <button on:click={() => (widgetDesign = WidgetStyle.SmallTopLeft)}
        >~2~</button
    >
    <select bind:value={selectedScene} on:change={onChangeCallback}>
        {#each exampleScenes as scene}
            <option value={scene}>
                {scene.name}
            </option>
        {/each}
    </select>
</div>
