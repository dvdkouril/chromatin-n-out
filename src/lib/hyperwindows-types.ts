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

export type Selection = {
    start: number;
    end: number;
    color: string;
};

/**
 * Should keep information relevant for the selections and selection widget part of a HyperWindow
 */
export type HWSelectionWidget = {
    id: number;
    level: number; //~ todo: probably move to HyperWindow
    binsNum: number;
    domain: { start: number; end: number };
    selections: { start: number; end: number; color: string }[];
    colorForSelections: string;
    // widgets: Widget[];
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
