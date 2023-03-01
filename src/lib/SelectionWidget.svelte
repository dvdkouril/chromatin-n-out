<script lang="ts">
    import * as d3 from "d3";
    import { afterUpdate } from "svelte";

    export let width;
    export let height;

    let selectionInProgress = false;
    let selection = { start: 0, end: 10 };

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
            // .attr("stroke", "white")
            // .attr("stroke-width", 1)
            // .attr("stroke-linejoin", "round")
            .selectAll("path")
            .data(arcs)
            .join("path")
            // .attr("fill", "#bbbbbb")
            .attr("fill", (d) =>
                isInSelection(d.data) ? "blue" : color(N[d.data])
            )
            .attr("d", arc)
            .on("mouseover", mouseOvered)
            .on("mousedown", mouseDown)
            .on("mouseup", mouseUp);

        return svg.node();
    };

    afterUpdate(() => {
        console.log("UPDATED");
        const container = d3.select("#container").node();
        container.appendChild(SelectionWidget(300));

    });

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
        if (selectionInProgress) {
            selection = {
                start: selection.start,
                end: event.target.__data__.data,
            };
            console.log(event);
        }
    };

    const mouseDown = (event) => {
        console.log("mouse down");
        selectionInProgress = true;
    };

    const mouseUp = (event) => {
        console.log("mouse up");
        selectionInProgress = false;
    };
</script>
