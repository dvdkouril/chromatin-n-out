<script lang="ts">
    import type { Widget } from "../../../widget";
    import DebugBar from "./DebugBar.svelte";
    import HyperWindow from "./HyperWindow.svelte";

    export let widgetTreeRoot;
    export let maxLevel;
    export let hyperWindowSize;
    export let selectionWidgetThickness;
    export let newSelectionCallback;
    export let selectionsColormap;
    export let spheres;

    $: widgetColumns = processTreeIntoColumns(widgetTreeRoot);

    const addToColumn = (columns, thingToAdd, index) => {
        if (columns[index] === undefined) {
            columns.push([thingToAdd]);
        } else {
            columns[index].push(thingToAdd);
        }
    };

    const addPaddingToColumn = (columns, paddingSize, index) => {
        const padding = paddingSize > 0 ? Array(paddingSize).fill(null) : [];

        if (columns[index] === undefined) {
            columns.push(padding);
        } else {
            columns[index] = columns[index].concat(padding);
        }
    };

    function processTreeIntoColumns(root: Widget): Widget[][] {
        if (root == null) {
            return [];
        }

        let columns = [];
        let stack: [Widget, number][] = [[root, 0]];
        let currentLayer = 0;
        while (stack.length > 0) {
            let [currentNode, layer] = stack.pop();
            const lvl = currentNode.level;

            //~ add the node
            addToColumn(columns, currentNode, lvl);
            //~ add padding to previous columns based on # of children
            let paddingSize = currentNode.widgets.length - 1;
            for (let i = 0; i <= lvl; i++) {
                addPaddingToColumn(columns, paddingSize, i);
            }

            //~ prepare next column
            let childrenNum = currentNode.widgets.length;
            if (childrenNum == 0) {
                //~ it's a leaf
                for (let i = lvl + 1; i <= maxLevel; i++) {
                    addPaddingToColumn(columns, 1, i);
                }
            }

            const widgetsReversed = currentNode.widgets.slice().reverse(); //~ doing reversing because stack does opposite order by nature
            let childNumber = widgetsReversed.length - 1;
            for (let w of widgetsReversed) {
                stack.push([w, layer + childNumber]);
                childNumber -= 1;
            }
        }

        return columns;
    }
</script>

<DebugBar {widgetColumns} {maxLevel} />

<div id="flex-container" style="display: flex;">
    {#each widgetColumns as widgetsColumn}
        <div class="widgets-column">
            {#each widgetsColumn as widget}
                {#if widget == null}
                    <div
                        style="display: block; width: {hyperWindowSize}px; height: {hyperWindowSize +
                            25}px; background-color: none"
                    />
                {:else}
                    <HyperWindow
                        {widget}
                        {hyperWindowSize}
                        {selectionWidgetThickness}
                        {newSelectionCallback}
                        colorForSelection={widget.colorForSelections}
                        bins={spheres.slice(
                            widget.domain.start,
                            widget.domain.end + 1
                        )}
                    />
                {/if}
            {/each}
        </div>
    {/each}
</div>
