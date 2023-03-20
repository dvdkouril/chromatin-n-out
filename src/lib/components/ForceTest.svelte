<script lang="ts">
    import { onMount } from "svelte";
    import { forceSimulation, forceManyBody, forceCenter } from "d3-force";

    const width = 600;
    const height = 600;

    onMount(() => {
        const makeDefaultNode = () => {
            return { x: 0, y: 0, r: 10 };
        };
        let nodes = new Array(5).fill(makeDefaultNode());
       
        //~ first set up forces
        let simulation = forceSimulation()
            .force("charge", forceManyBody())
            .force("center", forceCenter(width / 2, height / 2))
            .on("tick", ticked);

        //~ feed nodes and set up update function
        simulation
            .nodes(nodes)
            .on("tick", ticked);
    });

    const ticked = () => {};
</script>

<div id="force-test">
    <svg {width} {height} />
</div>
