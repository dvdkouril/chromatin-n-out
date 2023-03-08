<script lang="ts">
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
</script>