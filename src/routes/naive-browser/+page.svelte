<script lang="ts">
  import App from '$lib/components/App.svelte'
</script>

<div>
  <!-- <App /> -->
  <span style="color: white">
  TEST! Welcome to the Naive Browser prototype.
  </span>
</div>

<style>
  :global(body) {
    margin: 0;
  }

  div {
    width: 100vw;
    height: 100vh;
    background: rgb(13, 19, 32);
    background: linear-gradient(180deg, rgba(13, 19, 32, 1) 0%, rgba(8, 12, 21, 1) 100%);
  }
</style>
