import { IShape } from '../../Interfaces/IShape.interface';
import { ShapeModel } from '../shape.model';
import { Renderer2 } from '@angular/core';
import { IStyleOptions } from '../../Interfaces/IStyleOptions';
import { SvgFillOption } from '../../enums/SvgFillOption.enum';
import { SvgRenderOption } from '../../enums/SvgRenderOption.enum';
import { SvgStrokeOption } from '../../enums/SvgStrokeOption.enum';
import { SvgStrokeLinecapOption } from 'src/app/enums/SvgStrokeLinecapOption.enum';

export class PolylineModel extends ShapeModel implements IShape {
	//#region variable declarations
	element: HTMLElement;
	style: IStyleOptions;
	renderer: Renderer2;
	points: number[] = [];
	currentEndPoint: [number, number];
	origin: number[];
	offsetX: number;
	offsetY: number;
	dragX: number;
	dragY: number;
	dragging: boolean = false;
	isSelected: boolean = false;

	get properties(): object {
		return {
			position: {
				points: this.points,
			},
			style: this.style,
		};
	}
	//#endregion

	constructor(renderer: Renderer2, style: IStyleOptions) {
		super(renderer, 'polyline');
		this.setStyle(style);
	}

	// select object
	async select(): Promise<void> {
		return new Promise(() => {
			this.isSelected = true;
			this.renderer.addClass(this.element, 'selectedObject');
		});
	}

	// deselect object
	async deselect(): Promise<void> {
		return new Promise(() => {
			this.isSelected = false;
			this.renderer.removeClass(this.element, 'selectedObject');
		});
	}

	// begin draw process
	async startDraw(pos: number[]): Promise<void> {
		return new Promise(() => {});
	}

	// draw object to position
	async drawTo(point: number[]): Promise<void> {
		return new Promise(() => {
			point.forEach((p) => {
				this.points.push(p);
			});
			this.render();
		});
	}

	// begin drag process
	async startDrag(pos): Promise<void> {
		return new Promise(() => {
			this.dragging = true;
			this.offsetX = pos[0];
			this.offsetY = pos[1];
		});
	}

	// drag object to position
	async dragTo(pos): Promise<void> {
		return new Promise(() => {
			this.dragX = pos[0] - this.offsetX;
			this.dragY = pos[1] - this.offsetY;
			this.renderer.setAttribute(this.element, 'style', `transform: translate(${this.dragX}px, ${this.dragY}px)`);
		});
	}

	// end drag process
	async endDrag(): Promise<void> {
		return new Promise(() => {
			this.dragging = false;
			for (let i = 0; i < this.points.length; i += 2) {
				this.points[i] += this.dragX ? this.dragX : 0;
				this.points[i + 1] += this.dragY ? this.dragY : 0;
			}
			this.dragX = this.dragY = this.offsetX = this.offsetY = null;
			this.renderer.removeAttribute(this.element, 'style'); // remove style
			this.render();
		});
	}

	render(): void {
		this.renderer.setAttribute(this.element, 'points', `${this.points.join(' ')}`);
	}

	// update style attributes
	async setStyle(styling: IStyleOptions): Promise<void> {
		this.style = Object.assign({}, styling); // create shallow copy of styling
		Object.keys(this.style).forEach((style) => {
			switch (style as string) {
				case 'fillType':
					this.renderer.setAttribute(this.element, 'fill', 'none');
					break;
				case 'strokeType':
					switch (this.style.strokeType) {
						case SvgStrokeOption.solid:
							this.renderer.setAttribute(this.element, 'stroke', this.style['stroke']);
							break;
						case SvgStrokeOption.none:
							this.renderer.setAttribute(this.element, 'stroke', 'none');
							break;
					}
					break;
				case 'shapeRendering':
					this.renderer.setAttribute(this.element, 'shape-rendering', SvgRenderOption[this.style['shapeRendering']]);
					break;
				case 'strokeLinecap':
					this.renderer.setAttribute(this.element, 'stroke-linecap', SvgStrokeLinecapOption[this.style['strokeLinecap']]);
					break;
				default:
					// convert style options to kabob casing for html styling
					const kabobStyle: string = style.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase(); // html kabob casing
					this.renderer.setAttribute(this.element, kabobStyle, this.style[style]);
					break;
			}
		});
	}
}
