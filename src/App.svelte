<script lang="ts">
  import * as d3 from "d3";
  import SelectionWidget from "./lib/SelectionWidget.svelte";

  const width = 600;
  const height = 200;
  const topLevelBinsNum = 100;
  $: colorMap = generateColors(topLevelBinsNum);

  let widgets = [
    {
      binsNum: topLevelBinsNum,
      domain: {
        start: 0,
        end: topLevelBinsNum - 1,
      },
    },
  ];
  
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

    return colors;
  };

  const updateWidgets = (ev) => {
    //~ selection changed in some widget => update state here
    console.log("Widgets need updating!");
  };

  const newSelection = (ev) => {
    console.log("App: seeing change");
    console.log(ev);
    const sel = ev.detail.selection;
    const sourceWidgetId = ev.detail.sourceWidget;
    const sourceWidget = widgets[sourceWidgetId]; 
    const offset = sourceWidget.domain.start;
  //   widgets = [
  //     ...widgets,
  //     {
  //       binsNum: sel.end - sel.start,
  //       domain: { start: offset + sel.start, end: offset + sel.end} 
  //     },
  //   ];
  // };

  //~ TODO: when we get a selection that's edited, we want to scrub all the following widgets
  const newWidgets = widgets.slice(0, sourceWidgetId + 1);
  newWidgets.push(
    {
      binsNum: sel.end - sel.start,
      domain: { start: offset + sel.start, end: offset + sel.end} 
    }
  )

  widgets = newWidgets;

  //~ actions that will be reported:
  // - new selection => spawn new widget
  // - changed selection => update linked widget
  }
</script>

<div id="container">
  {#each widgets as w, i}
    <!-- <SelectionWidget {width} {height} N={w.binsNum} on:selectionFinished={updateWidgets} /> -->
    <SelectionWidget
      {width}
      {height}
      N={w.binsNum}
      colors={colorMap.slice(w.domain.start, w.domain.end)}
      widgetId={i}
      on:selectionFinished={newSelection}
    />
  {/each}
</div>
<main />

<style>
</style>
