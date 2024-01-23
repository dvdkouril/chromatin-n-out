import { writable, type Writable } from "svelte/store";

export const alert = writable("Welcome to the to-do list app!");

export const canvasSize = writable({width: 0, height: 0});

export const hoveredBin: Writable<{hwId: number; binId: number} | undefined> = writable(undefined);
