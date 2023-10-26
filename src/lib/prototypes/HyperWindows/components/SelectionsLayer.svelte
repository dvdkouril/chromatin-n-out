<script lang="ts">

</script>

<!-- <div id="arc-selection-widget" 
    style="position: absolute; z-index: 2; pointer-events: none"
>
    <svg
        {width}
        {height}
        viewBox={`${-width/2} ${-height/2} ${width} ${height}`}
        pointer-events="none"     
    >
        {#each segments as bin, i}
            <path
                d={bin}
                id={"bin-" + i}
                fill={i == hoveredBin ? "red" : colors[i]}
                pointer-events="all"
                on:mousedown={mouseDown}
                on:mouseup={mouseUp}
                on:mouseover={mouseOvered}
                on:mouseout={mouseOut}
                on:focus={() => {}}
            />
        {/each} -->
        <!-- Selection indication overlay -->
        <!-- {#if selections.length > 0}
            {#each selectionsArcs as selArc, i}
                <path
                    d={selArc}
                    id={"selection-arc-" + i}
                    style="stroke-width: 5px; stroke: {selections[i].color}; fill: none; pointer-events:none"
                />
            {/each}
        {/if} 
    </svg>
</div> -->


<!-- <ArcSelectionWidget
        width={100}
        height={100}
        widgetThickness={selectionWidgetThickness}
        N={widget.binsNum}
        colors={grayColorMap}
        {colorForSelection}
        on:selectionFinished={newSelectionCallback}
        bind:selections={widget.selections}
        widget={widget}
        bind:hoveredBin={hoveredBin}
    /> -->