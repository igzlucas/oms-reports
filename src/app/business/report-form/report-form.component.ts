import { Component, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';

import { EditorModule } from '@tinymce/tinymce-angular';

import { Report, ReportDetail, initialReportData } from '../../core/models/report.model';
import { Customer } from '../../core/models/customer.model';
import { Equipment } from '../../core/models/equipment.model';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Para usar FormBuilder y FormGroup
    EditorModule,      // El módulo del editor de texto enriquecido
  ],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.css']
})
export class ReportFormComponent implements AfterViewInit {
  @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;
  
  reportForm: FormGroup;
  signaturePad!: SignaturePad;

  // Datos de ejemplo - En un futuro vendrán de un servicio
  customers: Customer[] = [
    { id: '1', nombre: 'Cliente Ejemplo 1', email: 'c1@email.com', direccion: 'Direccion 1' },
    { id: '2', nombre: 'Cliente Ejemplo 2', email: 'c2@email.com', direccion: 'Direccion 2' },
  ];
  equipments: Equipment[] = [
    { id: 'e1', customerId: '1', nombre: 'Motor Principal' },
    { id: 'e2', customerId: '1', nombre: 'Generador Babor' },
    { id: 'e3', customerId: '2', nombre: 'Sistema de Navegación' },
  ];
  filteredEquipments: Equipment[] = [];

  // Configuración del editor de texto
  tinyMceConfig = {
    base_url: '/tinymce',
    suffix: '.min',
    plugins: 'lists link autolink autoresize',
    toolbar: 'undo redo | bold italic | bullist numlist | link',
    menubar: false,
    height: 300,
    autoresize_bottom_margin: 20
  };

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.reportForm = this.fb.group({
      id: [null],
      reporteId: [null, Validators.required],
      clienteId: ['', Validators.required],
      equipo: ['', Validators.required],
      fecha: [new Date().toISOString().substring(0, 16), Validators.required],
      problema: ['', Validators.required],
      trabajoRealizado: [initialReportData().trabajoRealizado, Validators.required],
      observaciones: [''],
      montoTotal: [0],
      moneda: ['USD', Validators.required],
      terminosCondiciones: [initialReportData().terminosCondiciones],
      nombreFirmaCliente: [''],
      detalles: this.fb.array([])
    });
  }

  ngAfterViewInit() {
    if (this.signatureCanvas) {
      this.signaturePad = new SignaturePad(this.signatureCanvas.nativeElement);
      this.resizeCanvas();
    } else {
      console.error('El canvas de la firma no está disponible.');
    }
  }

  // --- Lógica para el formulario ---

  get detalles(): FormArray {
    return this.reportForm.get('detalles') as FormArray;
  }

  addDetalle() {
    const detalleForm = this.fb.group({
      cantidad: [1, [Validators.required, Validators.min(1)]],
      descripcion: ['', Validators.required],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      total: [0]
    });
    this.detalles.push(detalleForm);
  }

  removeDetalle(index: number) {
    this.detalles.removeAt(index);
  }

  onCustomerChange(event: Event) {
    const customerId = (event.target as HTMLSelectElement).value;
    this.filteredEquipments = this.equipments.filter(e => e.customerId === customerId);
  }

  // --- Lógica para la firma ---

  resizeCanvas() {
    const canvas = this.signatureCanvas.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    this.clearSignature();
  }

  clearSignature() {
    this.signaturePad.clear();
  }

  getSignatureDataUrl(): string | undefined {
    if (this.signaturePad.isEmpty()) {
      return undefined;
    }
    return this.signaturePad.toDataURL(); // Devuelve la imagen en formato Base64
  }

  onSubmit() {
    if (this.reportForm.valid) {
      const formData = this.reportForm.value;
      const signature = this.getSignatureDataUrl();
      
      console.log('Formulario:', formData);
      console.log('Firma (Base64):', signature);
      // Aquí iría la lógica para guardar en Firestore
    } else {
      console.error('El formulario no es válido.');
      this.reportForm.markAllAsTouched();
    }
  }
}
