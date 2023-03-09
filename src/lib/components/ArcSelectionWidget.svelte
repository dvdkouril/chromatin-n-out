<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { arc, pie } from "d3-shape";

    const dispatch = createEventDispatcher();

    export let width;
    export let height;
    export let N;
    export let widgetId;
    export let colors;
    export let selection = null;

    let selectionInProgress = false;

    $: pieceSize = width / bins.length;
    // $: bins = [...Array(N).keys()];
    $: bins = [...Array(N).fill(1)];
    // const SelectionWidget = (num = 100) => {
    //         const svg = d3
    //             .create("svg")
    //             .attr("width", width)
    //             .attr("height", height)
    //             .style("background-color", "#aaaaaa")
    //             .attr("viewBox", [-width / 2, -height / 2, width, height]);

    //         const innerRadius = 160;
    //         const outerRadius = 200;

    //         const elNum = num;
    //         const V = d3.range(elNum);
    //         const N = d3.range(elNum);
    //         const I = d3.range(N.length).filter((i) => !isNaN(V[i]));

    //         // Chose a default color scheme based on cardinality.
    //         let colors = undefined;
    //         if (colors === undefined) {
    //             colors = d3.schemeSpectral[elNum];
    //         }
    //         if (colors === undefined) {
    //             colors = d3.quantize(
    //                 (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
    //                 elNum
    //             );
    //         }

    //         const color = d3.scaleOrdinal(V, colors);

    //         const arcs = d3
    //             .pie()
    //             .padAngle(1 / outerRadius)
    //             .sort(null)
    //             .value(1)(I);
    //         const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    //         svg.append("g")
    //             .selectAll("path")
    //             .data(arcs)
    //             .join("path")
    //             .attr("fill", (d) =>
    //                 isInSelection(d.data) ? "blue" : color(N[d.data])
    //             )
    //             .attr("d", arc)
    //             .on("mouseover", mouseOvered)
    //             .on("mousedown", mouseDown)
    //             .on("mouseup", mouseUp);

    //         return svg.node();
    //     };

    const arcGen = arc();

    // $: arcPath = arcGen({
    //     innerRadius: 0,
    //     outerRadius: 100,
    //     startAngle: 0,
    //     endAngle: Math.PI / 4, // radians
    // });

    $: arcs = pie()(bins);

    $: segments = arcs.map((arc) => {
        let input = {
            innerRadius: 50,
            outerRadius: 100,
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
        };
        return arcGen(input);
    });

    const mouseOvered = (event) => {
        if (selectionInProgress) {
            const binId = parseInt(event.target.id.split("-")[1]); //~ this is bit of a weird solution...maybe fix later
            //~ figure out which direction the selection is
            if (binId < selection.start) {
                selection = { ...selection, start: binId };
            } else {
                selection = { ...selection, end: binId };
            }
        }
    };

    const mouseDown = (event) => {
        const binId = event.target.id.split("-")[1];
        selection = { start: parseInt(binId), end: parseInt(binId) };
        selectionInProgress = true;
    };

    const mouseUp = (event) => {
        //~ => selection finished
        console.log("mouse UP");
        selectionInProgress = false;
        dispatch("selectionFinished", {
            selection: selection,
            sourceWidget: widgetId,
        });
    };
</script>

<div id="arc-selection-widget">
    <!-- <svg {width} {height}> -->
    <svg width={width} height={width} viewBox={"[" + -width / 2+ ", " + -height / 2 + ", " + width+ ", " + height + "]"}>
        {#each segments as bin, i}
            <path d={bin} style="transform:translate(150px,150px)" />
            <!-- <path d={bin} /> -->
        {/each}
    </svg>
</div>
