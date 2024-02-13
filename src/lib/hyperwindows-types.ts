import type { Euler, Vector3, Vector2 } from "three";

export type HWGeometry = {
    spheres: Vector3[];
    tubes: { position: Vector3; rotation: Euler; scale: number }[];
    sphereRadius: number;
    tubeBaseSize: number;
    modelWorldPosition: Vector3;
};

export type HW3DView = {
    rotationX: number;
    rotationY: number;
    zoom: number;

    viewSettings: {
        showPivotOrigin: boolean,
    }
};

export const default3DView = (): HW3DView => {
    return {
        rotationX: 0,
        rotationY: 0,
        zoom: 1,
        viewSettings: {
            showPivotOrigin: false,
        },
    };
};


/**
 * Node in a tree of HyperWindows hierarchy
 */
export type HyperWindow = {
    // screenPosition: Vector2;
    // currentRadius: number;
    // associatedBodyId: number;
    // associatedBodyIndex: number;
    id: number;

    model: HWGeometry;
    threeDView: HW3DView;
    widget: HWSelectionWidget;

    childHyperWindows: HyperWindow[];
};

//~ TODO: rename to LinearSelection?
export type Selection = {
    start: number;
    end: number;
    color: string;
};

export type SpatialSelection = {
    bins: number[],
    connectedBins: number[][],
};

/**
 * Should keep information relevant for the selections and selection widget part of a HyperWindow
 */
export type HWSelectionWidget = {
    id: number;
    level: number; //~ todo: probably move to HyperWindow
    treeId: number;
    binsNum: number;
    domain: { start: number; end: number };
    selections: { start: number; end: number; color: string }[];
    colorForSelections: string;
    // widgets: Widget[];
};

export const defaultSelectionWidget = (id: number, treeId: number, binsNum: number): HWSelectionWidget => { return {
        id: id,
        level: 0,
        treeId: treeId,
        binsNum: binsNum,
        domain: {
            start: 0,
            end: binsNum - 1,
        },
        selections: [],
        colorForSelections: "",
    };
};

/**
 * The single sourse of truth about where individual HyperWindows (and SelectionWidgets) should be positioned
 */
export type HyperWindowsLayout = {
    num: number; //~ number of HyperWindows/Widgets (centers/radii.length)

    centers: Vector2[];
    radii: number[];
};

export type BoundingSphere = {
    center: Vector2;
    radius: number;
};

export enum WidgetStyle {
        SmallTopLeft,
        Boundary,
    }
