import { GraphicsLibrary, IObject, Mesh, MeshShapes, ParametricShapes } from "../../..";
import type { Scene } from "../../../scene";
import { IParametricObject, Volume } from "../../objects/parametric";
import type { PassRenderSettings } from "../shared";
import { Pass } from "../shared";
import { meshShaderTemplate } from "./MeshShaderTemplate";
import { parametricShaderTemplate } from "./ParametricShaderTemplate";
import { volumeShaderTemplate } from "./VolumeShaderTemplate";

class Pipelines {
    private static _instance: Pipelines;
    private static _lastDeviceUsed: GPUDevice;

    public shaderModules: Map<string, GPUShaderModule>;
    public bindGroupLayouts: Map<string, GPUBindGroupLayout>;
    public pipelineLayouts: Map<string, GPUPipelineLayout>;
    public renderPipelines: Map<string, GPURenderPipeline>;

    private constructor(graphicsLibrary: GraphicsLibrary) {
        const device = graphicsLibrary.device;

        this.shaderModules = new Map();
        this.bindGroupLayouts = new Map();
        this.pipelineLayouts = new Map();
        this.renderPipelines = new Map();

        //#region Graphics Library Requirements
        const cameraBGL = graphicsLibrary.bindGroupLayouts.get('camera');

        if (!cameraBGL) {
            throw "Camera BGL of Graphics Library should have been initialized at this point."
        }
        //#endregion Graphics Library Requirements

        for (const ty of ParametricShapes) {
            const shaderCode = parametricShaderTemplate(
                ty.variableName,
                ty.typeName,
                ty.gpuCodeGlobals,
                ty.gpuCodeGetObject,
                ty.gpuCodeGetBoundingRectangleVertex,
                ty.gpuCodeIntersectionTest,
                {
                    color: ty.gpuCodeGetOutputValue('color'),
                    normal: ty.gpuCodeGetOutputValue('normal'),
                    ao: ty.gpuCodeGetOutputValue('ao')
                }
            );

            const shaderModule = device.createShaderModule({
                label: `DeferredPass-${ty.typeName}`,
                code: shaderCode
            });
            this.shaderModules.set(ty.typeName, shaderModule);

            const pipelineLayout = device.createPipelineLayout({
                label: `DeferredPass-${ty.typeName}`,
                bindGroupLayouts: [...[cameraBGL], ...ty.bindGroupLayouts],
            });
            this.pipelineLayouts.set(ty.typeName, pipelineLayout);

            this.renderPipelines.set(ty.typeName, device.createRenderPipeline({
                label: `DeferredPass-${ty.typeName}`,
                layout: pipelineLayout,
                vertex: {
                    module: shaderModule,
                    entryPoint: "main_vertex",
                },
                fragment: {
                    module: shaderModule,
                    entryPoint: "main_fragment",
                    targets: [// Color
                        {
                            format: navigator.gpu.getPreferredCanvasFormat(),
                        },
                        // World Positions
                        // {
                        //     format: "rgba32float",
                        // },
                        // World Normals
                        {
                            format: 'rgba32float',
                        },
                        {
                            format: 'rg8unorm',
                        }
                    ]

                },
                primitive: {
                    topology: 'triangle-strip',
                    stripIndexFormat: 'uint32',
                    cullMode: 'none',
                },

                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'greater',
                    format: 'depth32float',
                },
            }));
        }

        // Volume
        const shaderCode = volumeShaderTemplate(
            Volume.variableName,
            Volume.typeName,
            Volume.gpuCodeGlobals,
            Volume.gpuCodeGetObject,
            Volume.gpuCodeGetBoundingRectangleVertex,
            Volume.gpuCodeIntersectionTest,
            {
                color: Volume.gpuCodeGetOutputValue('color'),
                normal: Volume.gpuCodeGetOutputValue('normal'),
                ao: Volume.gpuCodeGetOutputValue('ao')
            }
        );

        const shaderModule = device.createShaderModule({
            label: `DeferredPass-Volume`,
            code: shaderCode
        });
        this.shaderModules.set('DeferredPass-Volume', shaderModule);

        const pipelineLayout = device.createPipelineLayout({
            label: `DeferredPass-Volume`,
            bindGroupLayouts: [...[cameraBGL], ...Volume.bindGroupLayouts],
        });
        this.pipelineLayouts.set('Volume', pipelineLayout);

        this.renderPipelines.set('DeferredPass-Volume', device.createRenderPipeline({
            label: `DeferredPass-Volume`,
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [// Color
                    {
                        format: 'rgba8unorm',
                        blend: {
                            color: {
                                operation: 'add',
                                srcFactor: 'one',
                                dstFactor: 'zero',
                            },
                            alpha: {
                                operation: 'add',
                                srcFactor: 'one',
                                dstFactor: 'zero',
                            }
                        },
                        writeMask: GPUColorWrite.ALL
                    },
                ]

            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32',
                cullMode: 'none',
            }
        }));

        for (const ty of MeshShapes) {
            const shaderCode = meshShaderTemplate(
                ty.gpuGlobals,
                ty.gpuVertexShader,
                ty.gpuFragmentShader,
                {
                    color: ty.gpuCodeGetOutputValue('color'),
                    normal: ty.gpuCodeGetOutputValue('normal'),
                    ao: ty.gpuCodeGetOutputValue('ao'),
                }
            );

            const shaderModule = device.createShaderModule({
                label: `DeferredPass-${ty.typeName}`,
                code: shaderCode
            });
            this.shaderModules.set(ty.typeName, shaderModule);

            const pipelineLayout = device.createPipelineLayout({
                label: `DeferredPass-${ty.typeName}`,
                bindGroupLayouts: [...[cameraBGL], ...ty.bindGroupLayouts],
            });

            this.pipelineLayouts.set(ty.typeName, pipelineLayout);

            this.renderPipelines.set(ty.typeName, device.createRenderPipeline({
                label: `DeferredPass-${ty.typeName}`,
                layout: pipelineLayout,
                vertex: {
                    module: shaderModule,
                    entryPoint: "main_vertex",
                },
                fragment: {
                    module: shaderModule,
                    entryPoint: "main_fragment",
                    targets: [// Color
                        {
                            format: navigator.gpu.getPreferredCanvasFormat(),
                        },
                        // World Positions
                        // {
                        //     format: "rgba32float",
                        // },
                        // World Normals
                        {
                            format: 'rgba32float',
                        },
                        {
                            format: 'rg8unorm',
                        }
                    ]

                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'none',
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'greater',
                    format: 'depth32float',
                },
            }));
        }

        Pipelines._lastDeviceUsed = graphicsLibrary.device;
    }

    public static getInstance(graphicsLibrary: GraphicsLibrary): Pipelines {
        if (this._instance && Pipelines._lastDeviceUsed == graphicsLibrary.device) {
            return this._instance;
        }

        return this._instance = new this(graphicsLibrary);
    }
}

export interface DeferredPassRenderSettings extends PassRenderSettings {
    encoder: GPUCommandEncoder,
    cameraBindGroup: GPUBindGroup,
    scene: Scene,
}

export class DeferredPass extends Pass {
    private _graphicsLibrary: GraphicsLibrary;
    private _pipelines: Pipelines;

    private width: number = 0;
    private height: number = 0;

    private _colorTexture: GPUTexture | null = null;
    private _volumeTexture: GPUTexture | null = null;
    private _depthTexture: GPUTexture | null = null;
    private _normalsTexture: GPUTexture | null = null;
    private _aoTexture: GPUTexture | null = null;

    constructor(graphicsLibrary: GraphicsLibrary) {
        super();

        this._graphicsLibrary = graphicsLibrary;
        this._pipelines = Pipelines.getInstance(graphicsLibrary);
    }

    private createTextures() {
        this._colorTexture?.destroy();
        this._colorTexture = this._graphicsLibrary.device.createTexture({
            format: navigator.gpu.getPreferredCanvasFormat(),
            size: { width: this.width, height: this.height },
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this._volumeTexture?.destroy();
        this._volumeTexture = this._graphicsLibrary.device.createTexture({
            format: 'rgba8unorm',
            size: { width: this.width, height: this.height },
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this._depthTexture?.destroy();
        this._depthTexture = this._graphicsLibrary.device.createTexture({
            format: 'depth32float',
            size: { width: this.width, height: this.height },
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this._normalsTexture?.destroy();
        this._normalsTexture = this._graphicsLibrary.device.createTexture({
            format: 'rgba32float',
            size: { width: this.width, height: this.height },
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this._aoTexture?.destroy();
        this._aoTexture = this._graphicsLibrary.device.createTexture({
            format: 'rg8unorm',
            size: { width: this.width, height: this.height },
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
    }

    public onResize(width: number, height: number): void {
        this.width = width;
        this.height = height;

        for (const parametricShape of ParametricShapes) {
            parametricShape.resize(this._graphicsLibrary, width, height);
        }

        Volume.resize(this._graphicsLibrary, width, height);

        this.createTextures();
    }

    public render({ encoder, cameraBindGroup, scene, frameID }: DeferredPassRenderSettings): void {
        if (!this._colorTexture || !this._volumeTexture || !this._depthTexture || !this._normalsTexture || !this._aoTexture) {
            return;
        }

        const renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this._colorTexture.createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
                {
                    view: this._normalsTexture.createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
                {
                    view: this._aoTexture.createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this._depthTexture.createView(),

                depthClearValue: 0.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        });

        renderPass.setBindGroup(0, cameraBindGroup);
        const nonVolumeObjects = scene.objects.filter(object => !(object instanceof Volume)) as IObject[];
        for (const object of nonVolumeObjects) {
            if (object instanceof IParametricObject) {
                const pipeline = this._pipelines.renderPipelines.get(object.getTypeName());

                if (!pipeline) continue;

                renderPass.setPipeline(pipeline);
                object.record(renderPass, 1, frameID);
            }
            if (object instanceof Mesh) {
                const pipeline = this._pipelines.renderPipelines.get(object.getTypeName());

                if (!pipeline) continue;

                renderPass.setPipeline(pipeline);
                object.record(renderPass, 1);
            }
        }

        renderPass.end();

        // Volumetric Render Pass
        const volumePipeline = this._pipelines.renderPipelines.get('DeferredPass-Volume');
        if (!this.depthTexture || !Volume.bindGroupLayouts[1] || !volumePipeline) {
            return;
        }

        const volumeRenderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this._volumeTexture.createView(),
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ]
        });

        const depthTextureBindGroup = this._graphicsLibrary.device.createBindGroup({
            layout: Volume.bindGroupLayouts[1],
            entries: [{
                binding: 0,
                resource: this.depthTexture.createView(),
            }]
        });


        volumeRenderPass.setPipeline(volumePipeline);
        volumeRenderPass.setBindGroup(0, cameraBindGroup);
        volumeRenderPass.setBindGroup(2, depthTextureBindGroup);

        if (volumePipeline) {
            const volumeObjects: Volume[] = scene.objects.filter(object => object instanceof Volume) as Volume[];
            for (const object of volumeObjects) {
                object.record(volumeRenderPass, 1, frameID);
            }
        }

        volumeRenderPass.end();
    };

    public get colorTexture(): GPUTexture | null {
        return this._colorTexture;
    }

    public get volumeTexture(): GPUTexture | null {
        return this._volumeTexture;
    }

    public get depthTexture(): GPUTexture | null {
        return this._depthTexture;
    }

    public get normalsTexture(): GPUTexture | null {
        return this._normalsTexture;
    }

    public get aoTexture(): GPUTexture | null {
        return this._aoTexture;
    }
}