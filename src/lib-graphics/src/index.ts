import type { OrbitCamera } from "./cameras/index";
import type { SmoothCamera } from "./cameras/smooth";
import { Mesh } from "./rendering/objects/mesh";
import { Circle, RoundedCone, RoundedConeInstanced, Sphere, Spline, SignedDistanceGrid, Volume } from "./rendering/objects/parametric";
import { Scene } from "./scene";
import { Viewport3D } from "./viewports/index";

export * from "./cameras/index";
export * from "./allocation/index";
export * from "./viewports/index";
export * from "./utils";
export * from "./culling";
export * from "./rendering";
export * from "./shared";

export let ParametricShapes = [
    Circle, Sphere, RoundedCone, RoundedConeInstanced, Spline, SignedDistanceGrid
];

export let MeshShapes = [Mesh];

export class GraphicsLibrary {
    private _adapter: GPUAdapter;
    private _device: GPUDevice;

    public shaderModules: Map<string, GPUShaderModule> = new Map();
    public bindGroupLayouts: Map<string, GPUBindGroupLayout> = new Map();
    public pipelineLayouts: Map<string, GPUPipelineLayout> = new Map();
    public renderPipelines: Map<string, GPURenderPipeline> = new Map();
    public computePipelines: Map<string, GPUComputePipeline> = new Map();
    
    private _nearestClampSampler: GPUSampler;
    // private _nearestRepeatSampler: GPUSampler;
    private _linearSampler: GPUSampler;
    private _dummy1DTextureView: GPUTextureView;

    constructor(adapter: GPUAdapter, device: GPUDevice) {
        this._adapter = adapter;
        this._device = device;

        this.bindGroupLayouts.set('camera', device.createBindGroupLayout({
            label: 'Camera BGL',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                buffer: {}
            }]
        }));

        for(const objectType of ParametricShapes) {
            objectType.createBindGroupLayouts(device);
        }

        Volume.createBindGroupLayouts(device);

        for(const objectType of MeshShapes) {
            objectType.createBindGroupLayouts(device);
        }

        this._nearestClampSampler = this._device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            addressModeW: 'clamp-to-edge',
        });
        // this._nearestRepeatSampler = this._device.createSampler({
        //     magFilter: 'nearest',
        //     minFilter: 'nearest',
        //     addressModeU: 'repeat',
        //     addressModeV: 'repeat',
        //     addressModeW: 'repeat',
        // });
        this._linearSampler = this._device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });
        this._dummy1DTextureView = device.createTexture({
            size: {
                width: 4,
                height: 1,
            },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        }).createView({
        });
    }

    public create3DViewport(scene: Scene | null = null, camera: OrbitCamera | SmoothCamera | null = null): Viewport3D {
        return new Viewport3D(this, scene, camera);
    }

    public createScene(): Scene {
        return new Scene(this);
    }

    public get adapter(): GPUAdapter {
        return this._adapter;
    }

    public get device(): GPUDevice {
        return this._device;
    }
    
    public get nearestSampler(): GPUSampler {
        return this._nearestClampSampler;
    }

    public get nearestClampSampler(): GPUSampler {
        return this._nearestClampSampler;
    }

    public get nearestRepeatSampler(): GPUSampler {
        return this._nearestClampSampler;
    }

    public get linearSampler(): GPUSampler {
        return this._linearSampler;
    }

    public get dummy1DTextureView(): GPUTextureView {
        return this._dummy1DTextureView;
    }
}
