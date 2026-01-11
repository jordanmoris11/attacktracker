declare module 'cytoscape-canvas' {
    const ext: any;
    export default ext;
}

// Extend Cytoscape Core with cyCanvas method
declare namespace cytoscape {
    interface Core {
        cyCanvas(options?: {
            zIndex?: number;
            pixelRatio?: 'auto' | number;
        }): {
            getCanvas(): HTMLCanvasElement;
            clear(ctx: CanvasRenderingContext2D): void;
            resetTransform(ctx: CanvasRenderingContext2D): void;
            setTransform(ctx: CanvasRenderingContext2D): void;
        };
    }
}
