import { Component, ViewChild, ElementRef, AfterViewInit, HostListener, Renderer2 } from '@angular/core';
import { LineModel } from '../../models/shapes/line.model';
import { RectModel } from '../../models/shapes/rect.model';
import { EllipseModel } from '../../models/shapes/ellipse.model';
import { PolylineModel } from '../../models/shapes/polyline.model';
import { PolygonModel } from '../../models/shapes/polygon.model';
import { IShape } from 'src/app/Interfaces/IShape.interface';
import { IShapeHashMap } from 'src/app/interfaces/IShapeHashMap.interface';
import { ToolInputService } from 'src/app/services/toolInput.service';
import { SelectorService } from 'src/app/services/selector.service';

@Component({
	selector: 'app-canvas',
	templateUrl: './canvas.component.html',
	styleUrls: ['./canvas.component.css'],
})
export class CanvasComponent implements AfterViewInit {
	@ViewChild('svg') element: ElementRef; // reference to svg element in dom
	@ViewChild('svgContainer') container: ElementRef; // reference to svg element in dom
	width: number = 1000; // width of svg
	height: number = 800; // height of svg
	vbWidth: number = 1000; // viewBox width
	vbHeight: number = 800; // viewBox height
	defViewBox: string = `0 0 ${this.vbWidth} ${this.vbHeight}`;

	offsetX: number; // offset position x of svg element
	offsetY: number; // offset position y of svg element
	currentObject: IShape; // current shape being drawn
    shapes: IShapeHashMap = {}; // hash map to hold refs to shape objects
    canvasOffsetX: number = 10;
    canvasOffsetY: number = 10;

	constructor(private renderer: Renderer2, private toolService: ToolInputService, private selectorService: SelectorService) {
		this.toolService.ToolEvent.subscribe((val) => {
			this.resetServices();
		});
	}

	ngAfterViewInit(): void {
		const containerSize = this.container.nativeElement.getBoundingClientRect();
		const vbox = `0 0 ${containerSize.width} ${containerSize.height}`;
		this.renderer.setAttribute(this.element.nativeElement, 'viewBox', vbox);

		this.offsetX = this.element.nativeElement.getBoundingClientRect().x;
		this.offsetY = this.element.nativeElement.getBoundingClientRect().y;

		// ! preliminary drawing of an svg object
		// ! concept can be used in future development to load a saved svg
		const testSvg1 = new EllipseModel(this.renderer, { stroke: 'black', fill: 'lightblue', 'stroke-width': 2 });
		testSvg1.start = [200, 200];
		testSvg1.end = [300, 300];
		this.renderer.appendChild(this.element.nativeElement, testSvg1.element);
		this.shapes[testSvg1.id] = testSvg1;

		const testSvg2 = new RectModel(this.renderer, { stroke: 'black', fill: 'lightgreen', 'stroke-width': 2 });
		testSvg2.start = [400, 100];
		testSvg2.end = [600, 300];
		this.renderer.appendChild(this.element.nativeElement, testSvg2.element);
		this.shapes[testSvg2.id] = testSvg2;

		const testSvg3 = new PolygonModel(this.renderer, { stroke: 'black', fill: 'pink', 'stroke-width': 2 });
		testSvg3.points = [800, 100, 900, 300];
		testSvg3.end = [700, 300];
		this.renderer.appendChild(this.element.nativeElement, testSvg3.element);
		this.shapes[testSvg3.id] = testSvg3;
	}

	// reset service handlers
	resetServices(): void {
		this.selectorService.deselect();
	}

	// window resize event handler
	@HostListener('window:resize', ['$event']) resize(e): void {
		const containerSize = this.container.nativeElement.getBoundingClientRect();
		const vbox = `0 0 ${containerSize.width} ${containerSize.height}`;
		this.renderer.setAttribute(this.element.nativeElement, 'viewBox', vbox);

		this.offsetX = this.element.nativeElement.getBoundingClientRect().x;
		this.offsetY = this.element.nativeElement.getBoundingClientRect().y;
	}

	// mouse down event handler
	@HostListener('mousedown', ['$event']) onMouseDown(e): void {
		// left mouse button click
		if (e.button === 0) {
			switch (this.toolService.currentTool) {
				case this.toolService.toolsOptions.select: {
					const hitObjectId = e.target.getAttribute('graphx-id'); // get id of hit object
					const hitObjectRef = this.shapes[hitObjectId]; // get ref to hit object
					if (hitObjectRef) {
						if (e.ctrlKey) {
							// ctrl key allows multiple selected objects
							this.selectorService.select(hitObjectRef);
							this.selectorService.startDrag([e.clientX, e.clientY]);
						} else {
							// verify if object is already selected
							if (!this.selectorService.lookup(hitObjectId)) {
								this.selectorService.deselect();
							}
							this.selectorService.select(hitObjectRef);
							this.selectorService.startDrag([e.clientX, e.clientY]);
						}
					} else {
						// if no graphx object -> deselect all
						this.selectorService.deselect();
					}
					break;
				}
				case this.toolService.toolsOptions.draw: {
					this.resetServices();
					switch (this.toolService.currentShape) {
						case this.toolService.shapeOptions.line: {
							this.currentObject = new LineModel(this.renderer, { stroke: this.toolService.strokeColor, 'stroke-width': this.toolService.strokeSize });
							break;
						}
						case this.toolService.shapeOptions.rectangle: {
							this.currentObject = new RectModel(this.renderer, { stroke: this.toolService.strokeColor, fill: this.toolService.fillColor, 'stroke-width': this.toolService.strokeSize });
							break;
						}
						case this.toolService.shapeOptions.ellipse: {
							this.currentObject = new EllipseModel(this.renderer, { stroke: this.toolService.strokeColor, fill: this.toolService.fillColor, 'stroke-width': this.toolService.strokeSize });
							break;
						}
						case this.toolService.shapeOptions.polyline: {
							if (!this.currentObject) {
								// if currently drawing do not create new object
								this.currentObject = new PolylineModel(this.renderer, { stroke: this.toolService.strokeColor, fill: 'none', 'stroke-width': this.toolService.strokeSize });
							}
							break;
						}
						case this.toolService.shapeOptions.polygon: {
							if (!this.currentObject) {
								// if currently drawing do not create new object
								this.currentObject = new PolygonModel(this.renderer, { stroke: this.toolService.strokeColor, fill: this.toolService.fillColor, 'stroke-width': this.toolService.strokeSize });
							}
							break;
						}
					}
					this.currentObject.start = [e.clientX - this.offsetX, e.clientY - this.offsetY];
					this.currentObject.end = [e.clientX - this.offsetX, e.clientY - this.offsetY];
					this.renderer.appendChild(this.element.nativeElement, this.currentObject.element);
					break;
				}
			}
			return;
		}

		// right mouse button click
		if (e.button === 2) {
			e.preventDefault(); // halt default context menu
			if (this.currentObject) {
				this.shapes[this.currentObject.id] = this.currentObject;
				this.currentObject = null;
			}
		}
	}

	updateMouseCoords(pos: [number, number]): void {
		this.toolService.updateMouseCoords(pos);
	}

	// mouse move event handler
	@HostListener('mousemove', ['$event']) onMouseMove(e): void {
		this.updateMouseCoords([e.clientX - this.offsetX - this.canvasOffsetX, e.clientY - this.offsetY - this.canvasOffsetY]);

		switch (this.toolService.currentTool) {
			case this.toolService.toolsOptions.select: {
				if (this.selectorService.canDrag) {
					this.selectorService.dragTo([e.clientX, e.clientY]);
				}
				break;
			}
			case this.toolService.toolsOptions.draw: {
				if (this.currentObject) {
					// special handling for polyline
					if (this.toolService.currentShape === this.toolService.shapeOptions.polyline) {
						this.currentObject.end = [e.clientX - this.offsetX, e.clientY - this.offsetY];
					} else {
						this.currentObject.end = [e.clientX - this.offsetX, e.clientY - this.offsetY];
					}
				}
				break;
			}
		}
	}

	// mouse up event handler
	@HostListener('mouseup', ['$event']) onMouseUp(e): void {
		switch (this.toolService.currentTool) {
			case this.toolService.toolsOptions.select: {
				this.selectorService.endDrag();
				break;
			}
			case this.toolService.toolsOptions.draw: {
				if (this.toolService.currentShape === this.toolService.shapeOptions.polyline || this.toolService.currentShape === this.toolService.shapeOptions.polygon) {
					return;
				}
				if (this.currentObject) {
					this.shapes[this.currentObject.id] = this.currentObject;
					this.currentObject = null;
					break;
				}
			}
		}
	}
}
