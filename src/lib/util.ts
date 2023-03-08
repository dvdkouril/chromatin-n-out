import * as d3 from "d3";

export const generateColors = (numOfColors) => {
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