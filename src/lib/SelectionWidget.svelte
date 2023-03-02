<script lang="ts">
    import * as d3 from "d3";
    import { afterUpdate } from "svelte";

    export let width;
    export let height;
    export let N;

    $: pieceSize = width / bins.length;
    $: bins = [...Array(N).keys()];
    $: binColors = generateColors(N);

    let selectionInProgress = false;
    let selection = { start: 5, end: 10 };
    // let bins = d3.range();
    // let bins = [ 1, 2, 3, 4, 5, 6];

    const generateColors = (numOfColors) => {
        let colors = undefined;
        if (colors === undefined) {
            colors = d3.schemeSpectral[numOfColors];
        }
        if (colors === undefined) {
            colors = d3.quantize(
                (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
                numOfColors
            );
        }

        // const color = d3.scaleOrdinal(bins, colors); //todo: do i need to grab bins from outside of local scope?
        // console.log("bin colors:");
        // console.log(color);
        // return color;
        return colors;
    };

    const SelectionWidget = (num = 100) => {
        const svg = d3
            .create("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background-color", "#aaaaaa")
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        const innerRadius = 160;
        const outerRadius = 200;

        const elNum = num;
        const V = d3.range(elNum);
        const N = d3.range(elNum);
        const I = d3.range(N.length).filter((i) => !isNaN(V[i]));

        // Chose a default color scheme based on cardinality.
        let colors = undefined;
        if (colors === undefined) {
            colors = d3.schemeSpectral[elNum];
        }
        if (colors === undefined) {
            colors = d3.quantize(
                (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
                elNum
            );
        }

        const color = d3.scaleOrdinal(V, colors);

        const arcs = d3
            .pie()
            .padAngle(1 / outerRadius)
            .sort(null)
            .value(1)(I);
        const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

        svg.append("g")
            .selectAll("path")
            .data(arcs)
            .join("path")
            .attr("fill", (d) =>
                isInSelection(d.data) ? "blue" : color(N[d.data])
            )
            .attr("d", arc)
            .on("mouseover", mouseOvered)
            .on("mousedown", mouseDown)
            .on("mouseup", mouseUp);

        return svg.node();
    };

    const colorOrSelection = (binId) => {
        if (isInSelection(binId)) {
            return "blue";
        } else {
            return binColors[binId];
        }
    }

    const isInSelection = (binId) => {
        // console.log(selection);
        // console.log("noooo");
        if (selection === null) return false;

        if (binId >= selection.start && binId < selection.end) {
            // console.log("yessss");
            return true;
        }

        // return true;
    };

    const mouseOvered = (event) => {
        // if (selectionInProgress) {
        //     selection = {
        //         start: selection.start,
        //         end: event.target.__data__.data,
        //     };
        //     console.log(event);
        // }
        if (selectionInProgress) {
            // console.log("mouse overed");
            const binId = event.target.id.split("-")[1];
            selection = { ...selection, end: binId};
        }
    };

    const mouseDown = (event) => {
        // console.log("mouse down");
        // console.log(event.target.id);
        
        const binId = event.target.id.split("-")[1];
        selection = { start: binId, end: binId };
        selectionInProgress = true;
    };

    const mouseUp = (event) => {
        // console.log("mouse up");
        selectionInProgress = false;
    };
</script>

<div id="widget">
    <svg {width} {height}>
        <!-- todo: viewbox and background -->
        {#each bins as bin, i}
            <!-- first version: just rectangles (to make it simpler) -->
            <rect
                id={"bin-" + i}
                x={0 + i * pieceSize}
                y={0}
                width={pieceSize}
                {height}
                on:mousedown={mouseDown}
                on:mouseup={mouseUp}
                on:mouseover={mouseOvered}
                style="fill:{binColors[i]}"
            />
        {/each}
        <rect 
            x={0 + selection.start * pieceSize}
            y={0}
            width={(selection.end - selection.start) * pieceSize}
            height={height}
            style="fill:blue"
        />
    </svg>

                <!-- style="fill:{binColors[i]}" -->
    <p>
        Selection: {selection.start} - {selection.end}
    </p>
    <p>
        Selection in progress: {selectionInProgress
            ? String.fromCodePoint(0x2705)
            : String.fromCodePoint(0x274c)}
    </p>
</div>
