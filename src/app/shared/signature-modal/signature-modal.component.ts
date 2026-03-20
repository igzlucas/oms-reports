
import { Component, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signature-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signature-modal.component.html',
  styleUrls: ['./signature-modal.component.css']
})
export class SignatureModalComponent implements AfterViewInit {
  @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() signatureSaved = new EventEmitter<string>();

  private context!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.resizeCanvas();
  }

  private initializeCanvas(): void {
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }
    this.context = ctx;
    this.context.strokeStyle = '#000';
    this.context.lineWidth = 2;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    this.initializeCanvas(); // Re-initialize context after resize
  }

  startDrawing(event: MouseEvent | TouchEvent): void {
    this.isDrawing = true;
    const { x, y } = this.getCoordinates(event);
    this.lastX = x;
    this.lastY = y;
  }

  draw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) return;
    event.preventDefault(); // Prevent scrolling on touch devices

    const { x, y } = this.getCoordinates(event);
    this.context.beginPath();
    this.context.moveTo(this.lastX, this.lastY);
    this.context.lineTo(x, y);
    this.context.stroke();
    
    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  private getCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  clearSignature(): void {
    const canvas = this.signatureCanvas.nativeElement;
    this.context.clearRect(0, 0, canvas.width, canvas.height);
  }

  saveSignature(): void {
    const canvas = this.signatureCanvas.nativeElement;
    if (this.isCanvasBlank()) {
      // Optional: handle case where canvas is blank
      this.close();
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    this.signatureSaved.emit(dataUrl);
    this.close();
  }

  isCanvasBlank(): boolean {
    const canvas = this.signatureCanvas.nativeElement;
    const pixelBuffer = new Uint32Array(
        this.context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
  }

  close(): void {
    this.modalClosed.emit();
  }
}
