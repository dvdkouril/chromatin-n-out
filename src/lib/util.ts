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

export const randomPositions = (
        num: number
    ): { x: number; y: number; z: number }[] => {
        let newSpheresArr = [];
        const max = 50;
        for (let i = 0; i < num; i++) {
            const x = Math.random() * max;
            const y = Math.random() * max;
            const z = Math.random() * max;
            newSpheresArr.push({ x: x, y: y, z: z });
        }
        return newSpheresArr;
    };