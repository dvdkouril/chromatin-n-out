import { writable } from "svelte/store";

export const alert = writable("Welcome to the to-do list app!");

export const canvasSize = writable({width: 0, height: 0});
