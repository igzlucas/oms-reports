import { Component, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signature-modal.component.html',
  styleUrls: ['./signature-modal.component.css']
})
export class SignatureModalComponent implements AfterViewInit {
  @ViewChild('signatureCanvas') private signatureCanvas?: ElementRef<HTMLCanvasElement>;
  @Output() signatureSaved = new EventEmitter<string>();
  @Output() modalClosed = new EventEmitter<void>();

  private signaturePad?: SignaturePad;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.signatureCanvas) {
      const canvas = this.signatureCanvas.nativeElement;
      this.signaturePad = new SignaturePad(canvas, {
        penColor: 'black',
        backgroundColor: 'white'
      });
      // Se llama al ajuste de tamaño inicial.
      this.resizeCanvas();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    if (!this.signaturePad || !this.signatureCanvas) return;

    const canvas = this.signatureCanvas.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    // Se ajusta el tamaño del canvas al de su contenedor padre (el wrapper del modal)
    const parent = canvas.parentElement as HTMLElement;
    canvas.width = parent.offsetWidth * ratio;
    canvas.height = parent.offsetHeight * ratio;

    const context = canvas.getContext('2d');
    if (context) {
        context.scale(ratio, ratio);
    }

    this.signaturePad.clear(); // Limpia la firma anterior para evitar duplicados
  }

  clearSignature(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  saveSignature(): void {
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      const dataUrl = this.signaturePad.toDataURL('image/png');
      this.signatureSaved.emit(dataUrl);
      this.onClose();
    } else {
      alert('Por favor, provea una firma antes de guardar.');
    }
  }

  onClose(): void {
    this.modalClosed.emit();
  }
}
