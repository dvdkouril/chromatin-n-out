# chromatin-n-out
Prototyping visualization & interaction methods for intuitive hierarchical navigation of 3D data that have a linear component (i.e., 3D chromatin models).

![chromatin-n-out WIP screenshot](screenshots/20230317145700.png)

## babylonjs rework
Doing everything declaratively is still somewhat difficult for me and I get stuck on how to access different properties and link the physics engine and the rendering. Also I don't think using Threlte at this point is feasible for actual projects at HMS, and I need to explore different options, Babylon.js being one of them.
- [ ] 

## todo
- [x] rectangular widget mvp
    - [x] single path selection
    - [x] individual levels selections can be edited/redefined (only one selection per level for now)
    - [x] selecting in both directions (0 -> N, N -> 0)
- [x] arc version of the selection widget
    - [x] basic functionality: like the rect version
    - [x] multiple selections: each spawning a new tree
    - [x] fancy colors for selections; base widget should be grayscale gradient
- [x] add 3D model rendering (probably threejs as baseline)
    - [x] include some basic threejs scene
    - [x] connect the shown 3D with selection widgets
    - [x] tube representation
- [x] arc selection widget + 3D view overlaid
    - [x] figure out how to propagate mousedown/up/move events through svg to threlte canvas
- [x] base hiearchical layout
- [ ] non-uniform, interactive and fluid layouting of 3D+widget
    - [x] basic physics-based bubbles layout 
    - [ ] interaction: zoom in/out triggers enlarging/shrinking which leads to fluid layout change
    - [ ] clicking on bubble makes spawn another one (neighbor/child)
- [ ] threlte/rapier physics layout
    - [ ] model local orbiting: don't move camera but rotation model
    - [ ] model local zooming: don't move camera but scale model
- [ ] support for larger models
    - [ ] aggregating the selection widget segments
    - [x] instancing the meshes (in threlte)
- [x] switching between base hierarchical prototype and fluid layout (presentation purposes)
- [ ] load chromosomes segmentation
- [ ] load gene annotation

### not doing (anymore)
- [ ] connect 2D physics with 3D models
    - [ ] single canvas & scene for all 3D parts
    - [ ] moving a 2D proxy (in physics engine) translates the coordinates into the 3D scene and moves the particular 3D part
- [ ] replace Threlte by chromoskein graphics library?

### too small to care
- [x] base arc widget colormap should always go from light gray to dark gray (don't take the slice of colormap because then you can't see the data segments)
- [ ] make random colors more disparate (not getting two similar shades after one another)
- [ ] indicate hovered bin (both on 3D and selection widget)

### kinda big issues
- [ ] 'There are too many active WebGL contexts on this page, the oldest context will be lost.'