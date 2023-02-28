<script lang="ts">
  import * as d3 from "d3";
  import { onMount } from "svelte";

  const width = 400;
  const height = 400;

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

    const arcs = d3
      .pie()
      .padAngle(1 / outerRadius)
      .sort(null)
      .value(1)(I);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    svg
      .append("g")
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .selectAll("path")
      .data(arcs)
      .join("path")
      .attr("fill", "#bbbbbb")
      .attr("d", arc);

    return svg.node();
  };

  onMount(() => {
    const container = d3.select("#container").node();
    container.appendChild(SelectionWidget(300));
    container.appendChild(SelectionWidget(100));
    container.appendChild(SelectionWidget(50));
    //d3.select("#container").append("p");
  });
</script>

<div id="container" />

<main />

<style>
</style>
