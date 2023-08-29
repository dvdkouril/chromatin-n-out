import type { Euler, Vector3, Vector2 } from "three";

export type HWGeometry = {
    spheres: { x: number; y: number; z: number }[];
    tubes: { position: Vector3; rotation: Euler; scale: number }[];
    rotationX: number;
};

export type HyperWindow = {
    screenPosition: Vector2;
    associatedBodyId: number;
    model: HWGeometry;
};