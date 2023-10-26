<script lang="ts">
    export let widgetColumns;
    export let maxLevel;
</script>

<div id="debug-info-bar" style="width: 100%;">
  maxLevel = {maxLevel}
  {#each widgetColumns as widgets}
    [
    {#each widgets as widget}
      {#if widget == null}
        [  ]
      {:else}
        {widget.id}:
        {#each widget.selections as sel}
          <span style="background-color: {sel.color}">{sel.color}</span>&nbsp;
        {/each}
      {/if}
    {/each}
    ]
  {/each}
</div>