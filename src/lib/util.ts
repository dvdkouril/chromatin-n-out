import * as d3 from "d3";
import { vec3 } from "gl-matrix";
import { Euler, PerspectiveCamera, Quaternion, Vector2, Vector3 } from "three";
import type { HWGeometry, HyperWindow } from "./hyperwindows-types";
import { parsePdb } from "./pdb";
import chroma from "chroma-js";

export const generateColors = (numOfColors: number) => {
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

export const generateGrayScale = (numOfColors: number) => {
    const darkGray = "#919191";
    const lightGray = "#cdcdcd";

    return d3.quantize(d3.interpolate(lightGray, darkGray), numOfColors);
}

export const generateGrayScaleColorMaps = (binNums: number[]) => {
    let ret: string[][] = [];
    for (const n of binNums) {
        const colormap = generateGrayScale(n);
        ret = [...ret, colormap];
    }
    return ret;
}

export const generateNicerColors = (numOfColors: number) => {
    //~ from here: https://observablehq.com/@d3/color-schemes
    // const numOfColors = 500;
    // let warm = ["#6e40aa", "#6f40aa", "#7140ab", "#723fac", "#743fac", "#753fad", "#773fad", "#783fae", "#7a3fae", "#7c3faf", "#7d3faf", "#7f3faf", "#803eb0", "#823eb0", "#833eb0", "#853eb1", "#873eb1", "#883eb1", "#8a3eb2", "#8b3eb2", "#8d3eb2", "#8f3db2", "#903db2", "#923db3", "#943db3", "#953db3", "#973db3", "#983db3", "#9a3db3", "#9c3db3", "#9d3db3", "#9f3db3", "#a13db3", "#a23db3", "#a43db3", "#a63cb3", "#a73cb3", "#a93cb3", "#aa3cb2", "#ac3cb2", "#ae3cb2", "#af3cb2", "#b13cb2", "#b23cb1", "#b43cb1", "#b63cb1", "#b73cb0", "#b93cb0", "#ba3cb0", "#bc3caf", "#be3caf", "#bf3caf", "#c13dae", "#c23dae", "#c43dad", "#c53dad", "#c73dac", "#c83dac", "#ca3dab", "#cb3daa", "#cd3daa", "#ce3da9", "#d03ea9", "#d13ea8", "#d33ea7", "#d43ea7", "#d53ea6", "#d73ea5", "#d83fa4", "#da3fa4", "#db3fa3", "#dc3fa2", "#de3fa1", "#df40a0", "#e040a0", "#e2409f", "#e3409e", "#e4419d", "#e5419c", "#e7419b", "#e8429a", "#e94299", "#ea4298", "#eb4397", "#ed4396", "#ee4395", "#ef4494", "#f04493", "#f14592", "#f24591", "#f34590", "#f4468f", "#f5468e", "#f6478d", "#f7478c", "#f8488b", "#f9488a", "#fa4988", "#fb4987", "#fc4a86", "#fd4a85", "#fe4b84", "#fe4b83", "#ff4c81", "#ff4d80", "#ff4d7f", "#ff4e7e", "#ff4e7d", "#ff4f7b", "#ff507a", "#ff5079", "#ff5178", "#ff5276", "#ff5275", "#ff5374", "#ff5473", "#ff5572", "#ff5570", "#ff566f", "#ff576e", "#ff586d", "#ff586b", "#ff596a", "#ff5a69", "#ff5b68", "#ff5c66", "#ff5d65", "#ff5d64", "#ff5e63", "#ff5f61", "#ff6060", "#ff615f", "#ff625e", "#ff635d", "#ff645b", "#ff655a", "#ff6659", "#ff6758", "#ff6857", "#ff6956", "#ff6a54", "#ff6b53", "#ff6c52", "#ff6d51", "#ff6e50", "#ff6f4f", "#ff704e", "#ff714d", "#ff724c", "#ff734b", "#ff744a", "#ff7549", "#ff7648", "#ff7847", "#ff7946", "#ff7a45", "#ff7b44", "#ff7c43", "#ff7d42", "#ff7e41", "#ff8040", "#ff813f", "#ff823e", "#ff833d", "#ff843d", "#ff863c", "#ff873b", "#ff883a", "#ff893a", "#ff8a39", "#ff8c38", "#ff8d37", "#ff8e37", "#ff8f36", "#fe9136", "#fd9235", "#fd9334", "#fc9534", "#fb9633", "#fa9733", "#f99832", "#f99a32", "#f89b32", "#f79c31", "#f69d31", "#f59f30", "#f4a030", "#f3a130", "#f2a32f", "#f1a42f", "#f0a52f", "#efa62f", "#eea82f", "#eda92e", "#ecaa2e", "#ebac2e", "#eaad2e", "#e9ae2e", "#e8b02e", "#e7b12e", "#e6b22e", "#e5b32e", "#e4b52e", "#e3b62e", "#e2b72f", "#e1b92f", "#e0ba2f", "#dfbb2f", "#debc30", "#ddbe30", "#dbbf30", "#dac030", "#d9c131", "#d8c331", "#d7c432", "#d6c532", "#d5c633", "#d4c833", "#d3c934", "#d2ca34", "#d1cb35", "#cfcc36", "#cece36", "#cdcf37", "#ccd038", "#cbd138", "#cad239", "#c9d33a", "#c8d53b", "#c7d63c", "#c6d73c", "#c5d83d", "#c4d93e", "#c3da3f", "#c2db40", "#c1dc41", "#c0dd42", "#bfdf43", "#bee044", "#bde146", "#bce247", "#bbe348", "#bae449", "#b9e54a", "#b8e64b", "#b7e74d", "#b6e84e", "#b6e94f", "#b5ea51", "#b4ea52", "#b3eb53", "#b2ec55", "#b1ed56", "#b1ee58", "#b0ef59", "#aff05b"];

    // return d3.quantize(d3.interpolate(warm), numOfColors);
    return d3.quantize(d3.interpolateWarm, numOfColors);

    // return warm;
}

export const randomNiceColor = () => {
    const warm = ["#6e40aa", "#6f40aa", "#7140ab", "#723fac", "#743fac", "#753fad", "#773fad", "#783fae", "#7a3fae", "#7c3faf", "#7d3faf", "#7f3faf", "#803eb0", "#823eb0", "#833eb0", "#853eb1", "#873eb1", "#883eb1", "#8a3eb2", "#8b3eb2", "#8d3eb2", "#8f3db2", "#903db2", "#923db3", "#943db3", "#953db3", "#973db3", "#983db3", "#9a3db3", "#9c3db3", "#9d3db3", "#9f3db3", "#a13db3", "#a23db3", "#a43db3", "#a63cb3", "#a73cb3", "#a93cb3", "#aa3cb2", "#ac3cb2", "#ae3cb2", "#af3cb2", "#b13cb2", "#b23cb1", "#b43cb1", "#b63cb1", "#b73cb0", "#b93cb0", "#ba3cb0", "#bc3caf", "#be3caf", "#bf3caf", "#c13dae", "#c23dae", "#c43dad", "#c53dad", "#c73dac", "#c83dac", "#ca3dab", "#cb3daa", "#cd3daa", "#ce3da9", "#d03ea9", "#d13ea8", "#d33ea7", "#d43ea7", "#d53ea6", "#d73ea5", "#d83fa4", "#da3fa4", "#db3fa3", "#dc3fa2", "#de3fa1", "#df40a0", "#e040a0", "#e2409f", "#e3409e", "#e4419d", "#e5419c", "#e7419b", "#e8429a", "#e94299", "#ea4298", "#eb4397", "#ed4396", "#ee4395", "#ef4494", "#f04493", "#f14592", "#f24591", "#f34590", "#f4468f", "#f5468e", "#f6478d", "#f7478c", "#f8488b", "#f9488a", "#fa4988", "#fb4987", "#fc4a86", "#fd4a85", "#fe4b84", "#fe4b83", "#ff4c81", "#ff4d80", "#ff4d7f", "#ff4e7e", "#ff4e7d", "#ff4f7b", "#ff507a", "#ff5079", "#ff5178", "#ff5276", "#ff5275", "#ff5374", "#ff5473", "#ff5572", "#ff5570", "#ff566f", "#ff576e", "#ff586d", "#ff586b", "#ff596a", "#ff5a69", "#ff5b68", "#ff5c66", "#ff5d65", "#ff5d64", "#ff5e63", "#ff5f61", "#ff6060", "#ff615f", "#ff625e", "#ff635d", "#ff645b", "#ff655a", "#ff6659", "#ff6758", "#ff6857", "#ff6956", "#ff6a54", "#ff6b53", "#ff6c52", "#ff6d51", "#ff6e50", "#ff6f4f", "#ff704e", "#ff714d", "#ff724c", "#ff734b", "#ff744a", "#ff7549", "#ff7648", "#ff7847", "#ff7946", "#ff7a45", "#ff7b44", "#ff7c43", "#ff7d42", "#ff7e41", "#ff8040", "#ff813f", "#ff823e", "#ff833d", "#ff843d", "#ff863c", "#ff873b", "#ff883a", "#ff893a", "#ff8a39", "#ff8c38", "#ff8d37", "#ff8e37", "#ff8f36", "#fe9136", "#fd9235", "#fd9334", "#fc9534", "#fb9633", "#fa9733", "#f99832", "#f99a32", "#f89b32", "#f79c31", "#f69d31", "#f59f30", "#f4a030", "#f3a130", "#f2a32f", "#f1a42f", "#f0a52f", "#efa62f", "#eea82f", "#eda92e", "#ecaa2e", "#ebac2e", "#eaad2e", "#e9ae2e", "#e8b02e", "#e7b12e", "#e6b22e", "#e5b32e", "#e4b52e", "#e3b62e", "#e2b72f", "#e1b92f", "#e0ba2f", "#dfbb2f", "#debc30", "#ddbe30", "#dbbf30", "#dac030", "#d9c131", "#d8c331", "#d7c432", "#d6c532", "#d5c633", "#d4c833", "#d3c934", "#d2ca34", "#d1cb35", "#cfcc36", "#cece36", "#cdcf37", "#ccd038", "#cbd138", "#cad239", "#c9d33a", "#c8d53b", "#c7d63c", "#c6d73c", "#c5d83d", "#c4d93e", "#c3da3f", "#c2db40", "#c1dc41", "#c0dd42", "#bfdf43", "#bee044", "#bde146", "#bce247", "#bbe348", "#bae449", "#b9e54a", "#b8e64b", "#b7e74d", "#b6e84e", "#b6e94f", "#b5ea51", "#b4ea52", "#b3eb53", "#b2ec55", "#b1ed56", "#b1ee58", "#b0ef59", "#aff05b"];
    return warm[getRandomInt(warm.length - 1)];
}

// Use case: new selection, need a new color
// i - i-th selection in the system
export const nextDistinctColorGlasbey = (i: number) => {
    const glasbeyColors = ['#d21820', '#1869ff', '#008a00', '#f36dff', '#710079', '#aafb00', '#00bec2', '#ffa235', '#5d3d04', '#08008a', '#005d5d', '#9a7d82', '#a2aeff', '#96b675', '#9e28ff', '#4d0014', '#ffaebe', '#ce0092', '#00ffb6', '#002d00', '#9e7500', '#3d3541', '#f3eb92', '#65618a', '#8a3d4d', '#5904ba', '#558a71', '#b2bec2', '#ff5d82', '#1cc600', '#92f7ff', '#2d86a6', '#395d28', '#ebceff', '#ff5d00', '#a661aa', '#860000', '#350059', '#00518e', '#9e4910', '#cebe00', '#002828', '#00b2ff', '#caa686', '#be9ac2', '#2d200c', '#756545', '#8279df', '#00c28a', '#bae7c2', '#868ea6', '#ca7159', '#829a00', '#2d00ff', '#d204f7', '#ffd7be', '#92cef7', '#ba5d7d', '#ff41c2', '#be86ff', '#928e65', '#a604aa', '#86e375', '#49003d', '#fbef0c', '#69555d', '#59312d', '#6935ff', '#b6044d', '#5d6d71', '#414535', '#657100', '#790049', '#1c3151', '#79419e', '#ff9271', '#ffa6f3', '#ba9e41', '#82aa9a', '#d77900', '#493d71', '#51a255', '#e782b6', '#d2e3fb', '#004931', '#6ddbc2', '#3d4d5d', '#613555', '#007151', '#5d1800', '#9a5d51', '#558edb', '#caca9a', '#351820', '#393d00', '#009a96', '#eb106d', '#8a4579', '#75aac2', '#ca929a', '#d2bac6', '#9ace00', '#456daa', '#755900', '#ce4d0c', '#00dffb', '#ff3d41', '#ffca49', '#2d3192', '#866986', '#9e82be', '#ceaeff', '#79452d', '#c6fb82', '#5d7549', '#b64549', '#ffdfef', '#a20071', '#4d4da6', '#a6aaca', '#711c28', '#287979', '#084900', '#006986', '#a67549', '#fbb682', '#55187d', '#00ff59', '#00414d', '#6d8e92', '#aa2400', '#bed26d', '#8a61ba', '#d241be', '#496151', '#cef3ef', '#61c261', '#148a4d', '#00ffe7', '#006900', '#b2799e', '#aab29e', '#ba55ff', '#c679ce', '#203120', '#7d04db', '#c2c6f7', '#8ac6ce', '#e7ebce', '#281c39', '#9effae', '#82ce9a', '#31a60c', '#00a275', '#db9255', '#3d1404', '#ff8a9a', '#828635', '#694d71', '#b66100', '#7d2d00', '#a2b239', '#31047d', '#a63dca', '#9a202d', '#04df86', '#757d6d', '#8a96d2', '#08a2ca', '#f76d5d', '#1055ca', '#dbb665', '#92596d', '#a2ffe3', '#595528', '#7179aa', '#d75965', '#492051', '#df4d92', '#0000ca', '#5d65d2', '#dfa600', '#b24992', '#b68a75', '#614d3d', '#a696a2', '#551c35', '#314141', '#757586', '#929ea2', '#759a71', '#ff8220', '#8655ff', '#9ac6b6', '#df96f3', '#cadf31', '#8e5d28', '#35bee3', '#71a6ff', '#598a31', '#ffc2eb', '#aa3d69', '#49617d', '#49351c', '#45b29e', '#1c2431', '#f731ef', '#7500a6', '#e7b6aa', '#826965', '#e3a2ca', '#202400', '#79b610', '#9e8eff', '#d2758a', '#cab6db', '#ae9adf', '#ff71db', '#d2f7b2', '#c6d7ce', '#ffd28a', '#5ddf35', '#5d7992', '#a28e00', '#aedfef', '#714dc2', '#7d4500', '#6592b6', '#5d79ff', '#514959', '#969e51', '#ce69ae', '#653575', '#dbd2e3', '#b6ae75', '#515900', '#b65939', '#5504eb', '#3d752d', '#92829a', '#822469', '#ba8639', '#8ab2e3', '#6db282', '#964135', '#6d4149', '#8a753d', '#b27175', '#921c49', '#df6d31', '#00e3df', '#9204ca', '#312859', '#007dd2', '#a26dff', '#825992'];

    return glasbeyColors[i];
};

export const nextDistinctColor = (i: number) => {
    const numColors = 23; //~ if too high, the neighboring colors start being indiscriminable; using now 23 as number of chromosomes in human genome

    // Generate a categorical color scale with distinct colors
    const distinctColors = chroma.scale('Set1').mode('lch').colors(numColors);

    if (i >= distinctColors.length) {
        console.log("ERR: distinct colors not enough for this number of selections");
        i = i % numColors;
    }

    return distinctColors[i];
};

export const randomPositions = (
    num: number
): { x: number; y: number; z: number }[] => {
    const newSpheresArr = [];
    const max = 50;
    for (let i = 0; i < num; i++) {
        const x = Math.random() * max;
        const y = Math.random() * max;
        const z = Math.random() * max;
        newSpheresArr.push({ x: x, y: y, z: z });
    }
    return newSpheresArr;
};


export const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max);
}

export const recenter = (
    ogPositions: Vector3[]
): Vector3[] => {
    const positions = ogPositions.map((pos: Vector3) => vec3.fromValues(pos.x, pos.y, pos.z));
    // TODO: it's kinda dumb to convert Vector3 -> vec3 and then back for return
    // TODO: should get rid of vec3 overall, but I need tests to see if functionality is the same

    const bbMax = positions.reduce(
        (a, b) => vec3.max(vec3.create(), a, b),
        vec3.fromValues(
            Number.MIN_VALUE,
            Number.MIN_VALUE,
            Number.MIN_VALUE
        )
    );
    const bbMin = positions.reduce(
        (a, b) => vec3.min(vec3.create(), a, b),
        vec3.fromValues(
            Number.MAX_VALUE,
            Number.MAX_VALUE,
            Number.MAX_VALUE
        )
    );
    const bbCenter = vec3.scale(
        vec3.create(),
        vec3.add(vec3.create(), bbMax, bbMin),
        0.5
    );
    const bbSides = vec3.sub(vec3.create(), bbMax, bbMin);
    bbSides.forEach((v: number) => Math.abs(v));
    
    const atomsNormalized = positions.map((a) =>
        vec3.sub(vec3.create(), a, bbCenter)
    );

    const outPositions = atomsNormalized.map((p: vec3) => new Vector3(p[0], p[1], p[2]));

    // return atomsNormalized;
    return outPositions;
};

export const getRotationFromTwoPositions = (from: Vector3, to: Vector3) => {
    const fromCopy = new Vector3(from.x, from.y, from.z);
    const toCopy = new Vector3(to.x, to.y, to.z);
    const q = new Quaternion();
    const u = new Vector3(0, 1, 0);
    const v = toCopy.sub(fromCopy).normalize();

    q.setFromUnitVectors(u, v);

    const eulers = new Euler();
    return eulers.setFromQuaternion(q);
}


export const computeTubes = (bins: { x: number; y: number; z: number }[]) => {
    const t: {position: Vector3, rotation: Euler, scale: number}[] = [];
    for (let i = 0; i < bins.length - 1; i++) {
        const first = new Vector3(bins[i].x, bins[i].y, bins[i].z);
        const second = new Vector3(
            bins[i + 1].x,
            bins[i + 1].y,
            bins[i + 1].z
        );

        //~ position between the two bins
        const pos = new Vector3();
        pos.subVectors(second, first);
        pos.divideScalar(2);
        pos.addVectors(first, pos);
        const tubePosition = pos;
        //~ rotation
        const tubeRotation = getRotationFromTwoPositions(first, second);
        //~ tube length
        const betweenVec = new Vector3();
        betweenVec.subVectors(second, first);
        const tubeScale = betweenVec.length();

        t.push({
            position: tubePosition,
            rotation: tubeRotation,
            scale: tubeScale,
        });
    }

    // console.log(t);
    return t;
};


export const unprojectToWorldSpace = (screenPosition: Vector2, camera: PerspectiveCamera): Vector3 => {
    const vec = new Vector3(); // create once and reuse
    const pos = new Vector3(); // create once and reuse

    vec.set(screenPosition.x * 2 - 1, -screenPosition.y * 2 + 1, 0.5);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    const distance = -camera.position.z / vec.z;
    pos.copy(camera.position).add(vec.multiplyScalar(distance));

    return pos;
};

export const projectPoint = (positionWorldSpace: Vector3, camera: PerspectiveCamera): Vector2 => {
    const projectedP = positionWorldSpace.clone().project(camera);
    projectedP.divideScalar(2);
    projectedP.addScalar(0.5);

    //~ flip the y
    projectedP.y = 1.0 - projectedP.y;

    return new Vector2(projectedP.x, projectedP.y);
};

export const projectModel = (hyperwindow: HyperWindow, camera: PerspectiveCamera): Vector2[] => {
    const newPoints: Vector2[] = [];

    const points: Vector3[] = hyperwindow.model.spheres.map(
        (p: { x: number; y: number; z: number }) =>
            new Vector3(p.x, p.y, p.z)
    );
    for (const p of points) {
        const cp = new Vector3(p.x, p.y, p.z);

        // const position = unprojectToWorldSpace(hyperwindow.screenPosition, camera); 
        // const position = hyperwindow.threeDView.worldPosition; 
        const position = hyperwindow.model.modelWorldPosition;
        const scale = hyperwindow.threeDView.zoom;
        const rotationX = hyperwindow.threeDView.rotationX;
        const rotationY = hyperwindow.threeDView.rotationY;

        cp.applyAxisAngle(new Vector3(0, 1, 0), rotationX * Math.PI / 180);
        cp.applyAxisAngle(new Vector3(1, 0, 0), rotationY * Math.PI / 180);
        cp.multiplyScalar(scale);
        cp.add(position);

        const projectedP = cp.project(camera);
        projectedP.divideScalar(2);
        projectedP.addScalar(0.5);

        //~ flip the y
        projectedP.y = 1.0 - projectedP.y;

        //~ output is <0,1>
        newPoints.push(new Vector2(projectedP.x, projectedP.y));
    }

    return newPoints;
};

export const projectModelToScreenSpace = (
    hyperwindow: HyperWindow,
    camera: PerspectiveCamera,
    canvasWidth: number,
    canvasHeight: number
): Vector2[] => {
    const pointsIn2D = projectModel(hyperwindow, camera);

    //~ transform from <0,1> to <0,width/height>
    const newPoints = pointsIn2D.map((p: Vector2): Vector2 => {
        return new Vector2(p.x * canvasWidth, p.y * canvasHeight);
    });

    return newPoints;
};

export const computeBoundingCircle = (points: Vector2[]): [Vector2, number] => {
    //~ 1. find two points that are far away
    const a = points[0];
    let b = points[1];

    const getDist = (p: Vector2, v: Vector2): number => {
        return p.distanceTo(v);
    };

    for (const p of points) {
        const d = getDist(a, p);
        if (d > getDist(a, b)) {
            b = p;
        }
    }

    //~ 2. initial estimation
    const radiusVec = b.clone();
    radiusVec.sub(a);
    radiusVec.divideScalar(2);

    let bsCenter = a.clone();
    bsCenter.add(radiusVec);

    let bsRadius = radiusVec.length();

    //~ DEBUG
    // return [bsCenter, bsRadius];

    //~ 3. adjust the estimation
    for (const p of points) {
        const v = p.clone().sub(bsCenter);
        const d = v.length();

        if (d > bsRadius) {
            //~ outside of the bounding sphere

            const difference = d - bsRadius;
            const newDiameter = 2 * bsRadius + difference;
            const newRadius = newDiameter / 2.0;
            v.normalize();
            const newCenter = bsCenter
                .clone()
                .add(v.multiplyScalar(difference / 2.0));

            bsCenter = newCenter;
            bsRadius = newRadius;
        }
    }

    return [bsCenter, bsRadius];
};

export const computeBoundingBox2D = (points: Vector2[]): [Vector2, Vector2] => {
    const bbMin = new Vector2(Infinity, Infinity);
    const bbMax = new Vector2(-Infinity, -Infinity);
    for (const p of points) {
        if (p.x < bbMin.x) {
            bbMin.setX(p.x);
        }
        if (p.y < bbMin.y) {
            bbMin.setY(p.y);
        }

        if (p.x > bbMax.x) {
            bbMax.setX(p.x);
        }
        if (p.y > bbMax.y) {
            bbMax.setY(p.y);
        }
    }

    return [bbMin, bbMax];
};

export const computeBoundingBox3D = (points: Vector3[]): [Vector3, Vector3] => {
    const bbMin = new Vector3(Infinity, Infinity, Infinity);
    const bbMax = new Vector3(-Infinity, -Infinity, -Infinity);
    for (const p of points) {
        if (p.x < bbMin.x) {
            bbMin.setX(p.x);
        }
        if (p.y < bbMin.y) {
            bbMin.setY(p.y);
        }
        if (p.z < bbMin.z) {
            bbMin.setZ(p.z);
        }

        if (p.x > bbMax.x) {
            bbMax.setX(p.x);
        }
        if (p.y > bbMax.y) {
            bbMax.setY(p.y);
        }
        if (p.z > bbMax.z) {
            bbMax.setZ(p.z);
        }
    }

    return [bbMin, bbMax];
};

export const generateStartingPositions = (
    n: number, width: number, height: number
): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = [];

    // const width = canvasWidth;
    // const height = canvasHeight;
    for (let i = 0; i < n; i++) {
        const xPos = getRandomInt(width);
        const yPos = getRandomInt(height);
        positions.push({ x: xPos, y: yPos });
    }

    return positions;
};

export const load3DModel = (
    file: string,
    scale: number,
    sphereRadius: number = 0.1,
    tubeSize: number = 0.05
): HWGeometry => {
    const spheres = parsePdb(file).bins.map(({ x, y, z }) => ({
        x: x * scale,
        y: y * scale,
        z: z * scale,
    }));

    //~ convert to Vector3
    const spheresConverted: Vector3[] = spheres.map(({x, y, z} : {x: number, y: number, z: number}) : Vector3 => { return new Vector3(x, y, z)});
    const spheresCentered = recenter(spheresConverted);

    // spheres = recenter(spheres).map((pos: vec3) => {
    //     return { x: pos[0], y: pos[1], z: pos[2] };
    // });

    const tubesLocal = computeTubes(spheresCentered);

    const geom: HWGeometry = {
        modelWorldPosition: new Vector3(0, 0, 0),
        spheres: spheresCentered,
        tubes: tubesLocal,
        sphereRadius: sphereRadius,
        tubeBaseSize: tubeSize,
    };

    return geom;
};

export const randomPositionAroundHyperWindow = (
    sourceWidgetPosition: Vector2,
    sourceWidgetRadius: number,
    newWidgetRadius: number,
): Vector2 => {
    const rndAngle = getRandomInt(360);
    const unitVec = new Vector2(1, 0);
    unitVec.rotateAround(
        new Vector2(0, 0),
        (rndAngle * Math.PI) / 180.0
    );
    unitVec.normalize();
    unitVec.multiplyScalar(sourceWidgetRadius + newWidgetRadius); 

    const newPosition = sourceWidgetPosition.clone().add(unitVec);
    return newPosition;
};

export const uvToScreen = (coords: Vector2, width: number, height: number): Vector2 => {
    const screenCoords = new Vector2(coords.x * width, coords.y * height);
    return screenCoords;
}

export const screenToUV = (coords: Vector2, width: number, height: number): Vector2 => {
    const uvCoords = new Vector2(coords.x / width, coords.y / height);
    return uvCoords;
}

export const isHoveredBin = (hoveredBin: {hwId: number; binId: number} | undefined, binId: number, hwId: number) => {
    if (hoveredBin == undefined) {
        return false;
    }
    if ((hoveredBin.hwId == hwId) && (hoveredBin.binId == binId)) {
        return true;
    }
    return false;
};
