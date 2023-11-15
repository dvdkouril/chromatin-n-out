<script lang="ts">
  import BigCanvas from "./lib/HyperWindows/HyperWindowsPrototype.svelte";
</script>

<div id="top-bar">
  <div id="title">HyperWindows</div>
  <div id="project-info">
    made by david kouril | <a href="https://github.com/dvdkouril/chromatin-n-out" target="_blank" rel="noreferrer"
      >&lt;code&gt;</a
    >
  </div>
</div>

<BigCanvas />

<style>
  #top-bar {
    display: flex;
    justify-content: space-between;
    /* text-align: left; */
    padding: 10pt;
  }
</style>
