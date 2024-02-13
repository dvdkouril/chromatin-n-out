import { writable, type Writable } from "svelte/store";
import type { SpatialSelection } from "./hyperwindows-types";

export const alert = writable("Welcome to the to-do list app!");

export const canvasSize = writable({width: 0, height: 0});

export const hoveredBin: Writable<{hwId: number; binId: number} | undefined> = writable(undefined);

export const hoveredHyperWindowId: Writable<number | undefined> = writable(undefined);

export const spatialSelection: Writable<{hwId: number; originBinId: number; radius: number; startMousePos: {x: number, y: number}; selection: SpatialSelection} | undefined> = writable(undefined);
