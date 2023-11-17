import * as d3 from "d3";
import { vec3 } from "gl-matrix";
import { Euler, PerspectiveCamera, Quaternion, Vector2, Vector3 } from "three";
import type { HWGeometry, HyperWindow } from "./hyperwindows-types";
import { parsePdb } from "./pdb";

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

export const generateGrayScale = (numOfColors) => {
    const darkGray = "#919191";
    const lightGray = "#cdcdcd";

    return d3.quantize(d3.interpolate(lightGray, darkGray), numOfColors);
}

export const generateNicerColors = (numOfColors) => {
    //~ from here: https://observablehq.com/@d3/color-schemes
    // const numOfColors = 500;
    // let warm = ["#6e40aa", "#6f40aa", "#7140ab", "#723fac", "#743fac", "#753fad", "#773fad", "#783fae", "#7a3fae", "#7c3faf", "#7d3faf", "#7f3faf", "#803eb0", "#823eb0", "#833eb0", "#853eb1", "#873eb1", "#883eb1", "#8a3eb2", "#8b3eb2", "#8d3eb2", "#8f3db2", "#903db2", "#923db3", "#943db3", "#953db3", "#973db3", "#983db3", "#9a3db3", "#9c3db3", "#9d3db3", "#9f3db3", "#a13db3", "#a23db3", "#a43db3", "#a63cb3", "#a73cb3", "#a93cb3", "#aa3cb2", "#ac3cb2", "#ae3cb2", "#af3cb2", "#b13cb2", "#b23cb1", "#b43cb1", "#b63cb1", "#b73cb0", "#b93cb0", "#ba3cb0", "#bc3caf", "#be3caf", "#bf3caf", "#c13dae", "#c23dae", "#c43dad", "#c53dad", "#c73dac", "#c83dac", "#ca3dab", "#cb3daa", "#cd3daa", "#ce3da9", "#d03ea9", "#d13ea8", "#d33ea7", "#d43ea7", "#d53ea6", "#d73ea5", "#d83fa4", "#da3fa4", "#db3fa3", "#dc3fa2", "#de3fa1", "#df40a0", "#e040a0", "#e2409f", "#e3409e", "#e4419d", "#e5419c", "#e7419b", "#e8429a", "#e94299", "#ea4298", "#eb4397", "#ed4396", "#ee4395", "#ef4494", "#f04493", "#f14592", "#f24591", "#f34590", "#f4468f", "#f5468e", "#f6478d", "#f7478c", "#f8488b", "#f9488a", "#fa4988", "#fb4987", "#fc4a86", "#fd4a85", "#fe4b84", "#fe4b83", "#ff4c81", "#ff4d80", "#ff4d7f", "#ff4e7e", "#ff4e7d", "#ff4f7b", "#ff507a", "#ff5079", "#ff5178", "#ff5276", "#ff5275", "#ff5374", "#ff5473", "#ff5572", "#ff5570", "#ff566f", "#ff576e", "#ff586d", "#ff586b", "#ff596a", "#ff5a69", "#ff5b68", "#ff5c66", "#ff5d65", "#ff5d64", "#ff5e63", "#ff5f61", "#ff6060", "#ff615f", "#ff625e", "#ff635d", "#ff645b", "#ff655a", "#ff6659", "#ff6758", "#ff6857", "#ff6956", "#ff6a54", "#ff6b53", "#ff6c52", "#ff6d51", "#ff6e50", "#ff6f4f", "#ff704e", "#ff714d", "#ff724c", "#ff734b", "#ff744a", "#ff7549", "#ff7648", "#ff7847", "#ff7946", "#ff7a45", "#ff7b44", "#ff7c43", "#ff7d42", "#ff7e41", "#ff8040", "#ff813f", "#ff823e", "#ff833d", "#ff843d", "#ff863c", "#ff873b", "#ff883a", "#ff893a", "#ff8a39", "#ff8c38", "#ff8d37", "#ff8e37", "#ff8f36", "#fe9136", "#fd9235", "#fd9334", "#fc9534", "#fb9633", "#fa9733", "#f99832", "#f99a32", "#f89b32", "#f79c31", "#f69d31", "#f59f30", "#f4a030", "#f3a130", "#f2a32f", "#f1a42f", "#f0a52f", "#efa62f", "#eea82f", "#eda92e", "#ecaa2e", "#ebac2e", "#eaad2e", "#e9ae2e", "#e8b02e", "#e7b12e", "#e6b22e", "#e5b32e", "#e4b52e", "#e3b62e", "#e2b72f", "#e1b92f", "#e0ba2f", "#dfbb2f", "#debc30", "#ddbe30", "#dbbf30", "#dac030", "#d9c131", "#d8c331", "#d7c432", "#d6c532", "#d5c633", "#d4c833", "#d3c934", "#d2ca34", "#d1cb35", "#cfcc36", "#cece36", "#cdcf37", "#ccd038", "#cbd138", "#cad239", "#c9d33a", "#c8d53b", "#c7d63c", "#c6d73c", "#c5d83d", "#c4d93e", "#c3da3f", "#c2db40", "#c1dc41", "#c0dd42", "#bfdf43", "#bee044", "#bde146", "#bce247", "#bbe348", "#bae449", "#b9e54a", "#b8e64b", "#b7e74d", "#b6e84e", "#b6e94f", "#b5ea51", "#b4ea52", "#b3eb53", "#b2ec55", "#b1ed56", "#b1ee58", "#b0ef59", "#aff05b"];

    // return d3.quantize(d3.interpolate(warm), numOfColors);
    return d3.quantize(d3.interpolateWarm, numOfColors);

    // return warm;
}

export const randomNiceColor = () => {
    let warm = ["#6e40aa", "#6f40aa", "#7140ab", "#723fac", "#743fac", "#753fad", "#773fad", "#783fae", "#7a3fae", "#7c3faf", "#7d3faf", "#7f3faf", "#803eb0", "#823eb0", "#833eb0", "#853eb1", "#873eb1", "#883eb1", "#8a3eb2", "#8b3eb2", "#8d3eb2", "#8f3db2", "#903db2", "#923db3", "#943db3", "#953db3", "#973db3", "#983db3", "#9a3db3", "#9c3db3", "#9d3db3", "#9f3db3", "#a13db3", "#a23db3", "#a43db3", "#a63cb3", "#a73cb3", "#a93cb3", "#aa3cb2", "#ac3cb2", "#ae3cb2", "#af3cb2", "#b13cb2", "#b23cb1", "#b43cb1", "#b63cb1", "#b73cb0", "#b93cb0", "#ba3cb0", "#bc3caf", "#be3caf", "#bf3caf", "#c13dae", "#c23dae", "#c43dad", "#c53dad", "#c73dac", "#c83dac", "#ca3dab", "#cb3daa", "#cd3daa", "#ce3da9", "#d03ea9", "#d13ea8", "#d33ea7", "#d43ea7", "#d53ea6", "#d73ea5", "#d83fa4", "#da3fa4", "#db3fa3", "#dc3fa2", "#de3fa1", "#df40a0", "#e040a0", "#e2409f", "#e3409e", "#e4419d", "#e5419c", "#e7419b", "#e8429a", "#e94299", "#ea4298", "#eb4397", "#ed4396", "#ee4395", "#ef4494", "#f04493", "#f14592", "#f24591", "#f34590", "#f4468f", "#f5468e", "#f6478d", "#f7478c", "#f8488b", "#f9488a", "#fa4988", "#fb4987", "#fc4a86", "#fd4a85", "#fe4b84", "#fe4b83", "#ff4c81", "#ff4d80", "#ff4d7f", "#ff4e7e", "#ff4e7d", "#ff4f7b", "#ff507a", "#ff5079", "#ff5178", "#ff5276", "#ff5275", "#ff5374", "#ff5473", "#ff5572", "#ff5570", "#ff566f", "#ff576e", "#ff586d", "#ff586b", "#ff596a", "#ff5a69", "#ff5b68", "#ff5c66", "#ff5d65", "#ff5d64", "#ff5e63", "#ff5f61", "#ff6060", "#ff615f", "#ff625e", "#ff635d", "#ff645b", "#ff655a", "#ff6659", "#ff6758", "#ff6857", "#ff6956", "#ff6a54", "#ff6b53", "#ff6c52", "#ff6d51", "#ff6e50", "#ff6f4f", "#ff704e", "#ff714d", "#ff724c", "#ff734b", "#ff744a", "#ff7549", "#ff7648", "#ff7847", "#ff7946", "#ff7a45", "#ff7b44", "#ff7c43", "#ff7d42", "#ff7e41", "#ff8040", "#ff813f", "#ff823e", "#ff833d", "#ff843d", "#ff863c", "#ff873b", "#ff883a", "#ff893a", "#ff8a39", "#ff8c38", "#ff8d37", "#ff8e37", "#ff8f36", "#fe9136", "#fd9235", "#fd9334", "#fc9534", "#fb9633", "#fa9733", "#f99832", "#f99a32", "#f89b32", "#f79c31", "#f69d31", "#f59f30", "#f4a030", "#f3a130", "#f2a32f", "#f1a42f", "#f0a52f", "#efa62f", "#eea82f", "#eda92e", "#ecaa2e", "#ebac2e", "#eaad2e", "#e9ae2e", "#e8b02e", "#e7b12e", "#e6b22e", "#e5b32e", "#e4b52e", "#e3b62e", "#e2b72f", "#e1b92f", "#e0ba2f", "#dfbb2f", "#debc30", "#ddbe30", "#dbbf30", "#dac030", "#d9c131", "#d8c331", "#d7c432", "#d6c532", "#d5c633", "#d4c833", "#d3c934", "#d2ca34", "#d1cb35", "#cfcc36", "#cece36", "#cdcf37", "#ccd038", "#cbd138", "#cad239", "#c9d33a", "#c8d53b", "#c7d63c", "#c6d73c", "#c5d83d", "#c4d93e", "#c3da3f", "#c2db40", "#c1dc41", "#c0dd42", "#bfdf43", "#bee044", "#bde146", "#bce247", "#bbe348", "#bae449", "#b9e54a", "#b8e64b", "#b7e74d", "#b6e84e", "#b6e94f", "#b5ea51", "#b4ea52", "#b3eb53", "#b2ec55", "#b1ed56", "#b1ee58", "#b0ef59", "#aff05b"];
    return warm[getRandomInt(warm.length - 1)];
}

export const randomColorFromRange = (colormap) => {
    return colormap[getRandomInt(colormap.length - 1)];
}

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


export const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max);
}

export const recenter = (
    ogPositions: Vector3[]
): Vector3[] => {
    let positions = ogPositions.map((pos: Vector3) => vec3.fromValues(pos.x, pos.y, pos.z));
    // TODO: it's kinda dumb to convert Vector3 -> vec3 and then back for return
    // TODO: should get rid of vec3 overall, but I need tests to see if functionality is the same

    let bbMax = positions.reduce(
        (a, b) => vec3.max(vec3.create(), a, b),
        vec3.fromValues(
            Number.MIN_VALUE,
            Number.MIN_VALUE,
            Number.MIN_VALUE
        )
    );
    let bbMin = positions.reduce(
        (a, b) => vec3.min(vec3.create(), a, b),
        vec3.fromValues(
            Number.MAX_VALUE,
            Number.MAX_VALUE,
            Number.MAX_VALUE
        )
    );
    let bbCenter = vec3.scale(
        vec3.create(),
        vec3.add(vec3.create(), bbMax, bbMin),
        0.5
    );
    let bbSides = vec3.sub(vec3.create(), bbMax, bbMin);
    bbSides.forEach((v: number) => Math.abs(v));
    const largestSide = Math.max(...bbSides);
    let bbLength = vec3.fromValues(
        1.0 / largestSide,
        1.0 / largestSide,
        1.0 / largestSide
    );
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
    let q = new Quaternion();
    const u = new Vector3(0, 1, 0);
    const v = toCopy.sub(fromCopy).normalize();

    q.setFromUnitVectors(u, v);

    const eulers = new Euler();
    return eulers.setFromQuaternion(q);
}


export const computeTubes = (bins: { x: number; y: number; z: number }[]) => {
    let t = [];
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
    var vec = new Vector3(); // create once and reuse
    var pos = new Vector3(); // create once and reuse

    vec.set(screenPosition.x * 2 - 1, -screenPosition.y * 2 + 1, 0.5);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    var distance = -camera.position.z / vec.z;
    pos.copy(camera.position).add(vec.multiplyScalar(distance));

    return pos;
};

export const projectPoint = (positionWorldSpace: Vector3, camera: PerspectiveCamera): Vector2 => {
    let projectedP = positionWorldSpace.clone().project(camera);
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
    for (let p of points) {
        let cp = new Vector3(p.x, p.y, p.z);

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

        let projectedP = cp.project(camera);
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
    let a = points[0];
    let b = points[1];

    const getDist = (p: Vector2, v: Vector2): number => {
        return p.distanceTo(v);
    };

    for (let p of points) {
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
    for (let p of points) {
        const v = p.clone().sub(bsCenter);
        const d = v.length();

        if (d > bsRadius) {
            //~ outside of the bounding sphere

            let difference = d - bsRadius;
            let newDiameter = 2 * bsRadius + difference;
            let newRadius = newDiameter / 2.0;
            v.normalize();
            let newCenter = bsCenter
                .clone()
                .add(v.multiplyScalar(difference / 2.0));

            bsCenter = newCenter;
            bsRadius = newRadius;
        }
    }

    return [bsCenter, bsRadius];
};

export const computeBoundingBox2D = (points: Vector2[]): [Vector2, Vector2] => {
    let bbMin = new Vector2(Infinity, Infinity);
    let bbMax = new Vector2(-Infinity, -Infinity);
    for (let p of points) {
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
    let bbMin = new Vector3(Infinity, Infinity, Infinity);
    let bbMax = new Vector3(-Infinity, -Infinity, -Infinity);
    for (let p of points) {
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
    let positions: { x: number; y: number }[] = [];

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
    let spheres = parsePdb(file).bins.map(({ x, y, z }) => ({
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
    sourceWidgetRadius: number
): Vector2 => {
    const rndAngle = getRandomInt(360);
    const unitVec = new Vector2(1, 0);
    unitVec.rotateAround(
        new Vector2(0, 0),
        (rndAngle * Math.PI) / 180.0
    );
    unitVec.normalize();
    unitVec.multiplyScalar(sourceWidgetRadius * 2.0); //~ x2.0 is overestimation probably

    const newPosition = sourceWidgetPosition.clone().add(unitVec);
    return newPosition;
};