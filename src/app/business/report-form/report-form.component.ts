import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, of, throwError, Observable, Subscription } from 'rxjs';
import { switchMap, catchError, finalize, take } from 'rxjs/operators';
import { Report } from '../../core/models/report.model';
import { Customer } from '../../core/models/customer.model';
import { Detalle } from '../../core/models/detalle.model';
import { ReportService } from '../../core/services/report.service';
import { CustomersService } from '../../core/services/customers.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { SignaturePadModule } from 'angular2-signaturepad';
import { SignatureModalComponent } from '../../shared/signature-modal/signature-modal.component';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EditorComponent,
    SignaturePadModule,
    SignatureModalComponent
  ],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.css']
})
export class ReportFormComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private reportService = inject(ReportService);
  private customersService = inject(CustomersService);
  private empresaService = inject(EmpresaService);
  private cdr = inject(ChangeDetectorRef);

  reportForm: FormGroup;
  isEditMode = false;
  reportId: string | null = null;
  clients: Customer[] = [];
  equipos: any[] = [];
  empresaId: string | null = null;
  initializationError: string | null = null;
  isLoading = true;
  isSaving = false;
  signatureDataUrl: string | null = null;
  showSignatureModal = false;
  private subscriptions = new Subscription();

  tinyMceConfig = {
    base_url: '/tinymce',
    suffix: '.min',
    plugins: 'lists link image table code help wordcount',
    menubar: false
  };

  constructor() {
    this.reportForm = this.fb.group({
      reporteId: [{ value: '', disabled: true }],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      clientId: ['', Validators.required],
      equipo: [''],
      problema: [''],
      trabajoRealizado: [''],
      observaciones: [''],
      terminosCondiciones: [''],
      moneda: ['MXN', Validators.required],
      montoTotal: [0, [Validators.required, Validators.min(0)]],
      status: ['pendiente', Validators.required],
      detalles: this.fb.array([]),
      diasVigencia: [0],
      nombreFirmaCliente: [''],
      firma: [''],
      pin: [''],
      publicLinkToken: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupClientChangeListener();
    this.subscribeToDetallesChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // --- FUNCIÓN CORREGIDA CON TIPOS EXPLÍCITOS ---
  private subscribeToDetallesChanges(): void {
    const sub = this.detalles.valueChanges.subscribe(detalles => {
      const total = detalles.reduce((acc: number, current: any) => {
        const cantidad = Number(current.cantidad) || 0;
        const precioUnitario = Number(current.precioUnitario) || 0;
        return acc + (cantidad * precioUnitario);
      }, 0);
      this.reportForm.get('montoTotal')?.setValue(total, { emitEvent: false });
    });
    this.subscriptions.add(sub);
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.reportId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.reportId;

    const dataSub = this.empresaService.getEmpresa().pipe(
      switchMap(empresa => {
        if (!empresa || !empresa.id) {
          return throwError(() => new Error('Empresa no encontrada. No se puede continuar.'));
        }
        this.empresaId = empresa.id;
        this.reportForm.patchValue({ terminosCondiciones: empresa.terminosCondicionesPorDefecto || '' });

        const clients$ = this.customersService.getCustomers().pipe(take(1));
        
        const reportData$: Observable<Report | number | null> = this.isEditMode && this.reportId
          ? this.reportService.getReportById(this.reportId)
          : this.reportService.getNextReportId(this.empresaId);

        return forkJoin({ clients: clients$, reportData: reportData$ });
      }),
      catchError(error => {
        this.initializationError = `Error al cargar datos iniciales: ${error.message}`;
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(result => {
      if (!result) return;

      this.clients = result.clients;

      if (this.isEditMode) {
        const report = result.reportData as Report;
        if (report) {
          this.detalles.clear();
          this.reportForm.patchValue(report);
          if (report.detalles) {
            report.detalles.forEach(d => this.addDetalle(d));
          }
        }
      } else {
        const nextReportId = result.reportData as number;
        if (nextReportId > 0) {
          this.reportForm.get('reporteId')?.setValue(nextReportId);
        }
      }
    });
    this.subscriptions.add(dataSub);
  }
  
  // --- FUNCIÓN CORREGIDA CON EL ERROR DE TIPEO ---
  private setupClientChangeListener(): void {
    const clientChangesSub = this.reportForm.get('clientId')!.valueChanges.subscribe(clientId => {
      this.equipos = [];
      this.reportForm.get('equipo')!.setValue('');

      if (clientId) {
        const selectedClient = this.clients.find(client => client.id === clientId);
        if (selectedClient && selectedClient.equipos) {
          this.equipos = selectedClient.equipos; // Corregido: equipos en lugar de equipios
        }
      }
      this.cdr.detectChanges();
    });
    this.subscriptions.add(clientChangesSub);
  }

  get detalles(): FormArray {
    return this.reportForm.get('detalles') as FormArray;
  }

  addDetalle(detalle?: Detalle): void {
    const detalleForm = this.fb.group({
      descripcion: [detalle ? detalle.descripcion : '', Validators.required],
      cantidad: [detalle ? detalle.cantidad : 1, [Validators.required, Validators.min(1)]],
      precioUnitario: [detalle ? detalle.precioUnitario : 0, [Validators.required, Validators.min(0)]]
    });
    this.detalles.push(detalleForm);
  }

  removeDetalle(index: number): void {
    this.detalles.removeAt(index);
  }

  onSubmit(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }
    if (!this.empresaId) {
      this.initializationError = 'Error: No se ha podido identificar la empresa.';
      return;
    }
    this.isSaving = true;

    const reportData: Partial<Report> = {
      ...this.reportForm.getRawValue(),
      empresaId: this.empresaId,
      firma: this.signatureDataUrl || this.reportForm.get('firma')?.value || ''
    };

    let isNewReport = !this.isEditMode;
    let currentPin = this.reportForm.get('pin')?.value;
    let currentToken = this.reportForm.get('publicLinkToken')?.value;

    if (isNewReport || !currentPin) {
      reportData.pin = Math.floor(100000 + Math.random() * 900000).toString();
    }

    if (isNewReport || !currentToken) {
      reportData.publicLinkToken = this.generateSecureToken();
    }
    
    const savePromise = this.isEditMode && this.reportId
      ? this.reportService.updateReport(this.reportId, reportData)
      : this.reportService.addReport(reportData as Report);

    savePromise
      .then(() => this.router.navigate(['/reports-table']))
      .catch(error => {
        console.error('Error saving report:', error);
        this.initializationError = 'Hubo un error al guardar el reporte. Intente de nuevo.';
      })
      .finally(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      });
  }

  private generateSecureToken(): string {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timePart = Date.now().toString(36);
    return randomPart + timePart;
  }
  
  openSignatureModal(): void { this.showSignatureModal = true; }
  clearSignature(): void { this.signatureDataUrl = null; }
  onModalClosed(): void { this.showSignatureModal = false; }
  onSignatureSaved(data: string): void {
    this.signatureDataUrl = data;
    this.showSignatureModal = false;
    this.cdr.detectChanges();
  }
}
