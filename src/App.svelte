<script lang="ts">
  import * as d3 from "d3";
  import { onMount } from "svelte";
    import SelectionWidget from "./lib/SelectionWidget.svelte";

  const width = 400;
  const height = 400;
  
</script>

<div id="container">
  <SelectionWidget width={600} height={200} N={100} /> 
  <SelectionWidget width={600} height={200} N={50} /> 
  <SelectionWidget width={600} height={200} N={10} /> 
</div>
<main />

<style>
</style>
