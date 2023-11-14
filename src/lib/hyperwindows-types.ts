import type { Euler, Vector3, Vector2 } from "three";

export type HWGeometry = {
    spheres: { x: number; y: number; z: number }[];
    tubes: { position: Vector3; rotation: Euler; scale: number }[];
    sphereRadius: number;
    tubeBaseSize: number;
    modelWorlPosition: Vector3;
};

export type HW3DView = {
    rotationX: number;
    rotationY: number;
    zoom: number;
};

/**
 * Node in a tree of HyperWindows hierarchy
 */
export type HyperWindow = {
    screenPosition: Vector2;
    currentRadius: number;
    associatedBodyId: number;
    associatedBodyIndex: number;

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

export type BoundingSphere = {
    center: Vector2;
    radius: number;
};