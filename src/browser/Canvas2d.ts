import Renderer from "../lib/Renderer";

export default class Canvas2d implements Renderer {

    public element: HTMLCanvasElement;

    public width: number;
    public height: number;
    public context: CanvasRenderingContext2D;

    constructor(width: number, height:number) {
        this.width = width;
        this.height = height;

        this.element = this.createElement(width, height);
        this.context = this.element.getContext('2d')!;
    }

    protected createElement(width: number, height: number) {
        const element = document.createElement('canvas');
        
        element.width = width;
        element.height = height;
        element.style.border = "1px solid black";

        return element;
    }

    public drawLine(x1: number, y1: number, x2: number, y2: number, color: string) {
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
    }

    public drawRect(x1: number, y1: number, w: number, h: number, color: string, fill = false) {
        if (fill == true) {
            this.context.fillStyle = color;
            this.context.fillRect(x1, y1, w, h);
            return;
        }
        this.context.strokeStyle = color;
        this.context.strokeRect(x1, y1, w, h);
    }

    public background(color: string) {
        this.context.fillStyle = color;
        this.context.fillRect(0, 0, this.width, this.height);
    }

    public drawCircle(x1: number, y1: number, radius: number, color: string) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x1, y1, radius, 0, 2 * Math.PI);
        this.context.fill();
    }

    public clear () {
        this.context.clearRect(0, 0, this.width, this.height);
    }
}