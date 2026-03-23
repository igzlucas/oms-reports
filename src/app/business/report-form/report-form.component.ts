import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { of, Subscription, forkJoin } from 'rxjs';
import { switchMap, take, map, catchError } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';

// Services
import { ReportService } from '../../core/services/report.service';
import { ClientService } from '../../core/services/client.service';
import { EmpresaService } from '../../core/services/empresa.service';

// Models
import { Report } from '../../core/models/report.model';
import { Client } from '../../core/models/client.model';

// Components
import { SignatureModalComponent } from '../../shared/signature-modal/signature-modal.component';
import { EditorComponent } from '@tinymce/tinymce-angular';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SignatureModalComponent,
    EditorComponent
  ],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.css']
})
export class ReportFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private empresaService = inject(EmpresaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  reportForm!: FormGroup;
  clients: Client[] = [];
  equipos: any[] = [];

  isEditMode = false;
  reportId?: string;
  isLoading = true;
  isSaving = false;
  empresaId!: string;

  showSignatureModal = false;
  signatureDataUrl: string | null = null;
  
  private subscriptions = new Subscription();

  public tinyMceConfig = {
    height: 250,
    menubar: false,
    plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'],
    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | help'
  };

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
    this.setupConditionalValidation();
    this.handleCostChanges();
    this.onClientChange();
  }

  private initializeForm(): void {
    this.reportForm = this.fb.group({
      reporteId: [{value: null, disabled: true}],
      fecha: [this.formatDateToInput(new Date()), Validators.required],
      clientId: [null, Validators.required],
      equipo: [null, Validators.required],
      problema: [''],
      trabajoRealizado: [''],
      observaciones: [''],
      detalles: this.fb.array([]),
      montoTotal: [{value: 0, disabled: true}],
      moneda: ['USD', Validators.required],
      terminosCondiciones: [''],
      diasVigencia: [0, [Validators.required, Validators.min(0)]],
      nombreFirmaCliente: [''],
      firma: [null]
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;

    this.route.paramMap.pipe(
      take(1),
      map(params => params.get('id')),
      switchMap(id => {
        this.isEditMode = !!id;
        this.reportId = id ?? undefined;
        return this.empresaService.getEmpresa().pipe(take(1));
      }),
      switchMap(empresa => {
        if (!empresa || !empresa.id) throw new Error("Empresa no encontrada");
        this.empresaId = empresa.id;

        const clients$ = this.clientService.getClientsByEmpresa(this.empresaId).pipe(take(1));

        if (this.isEditMode && this.reportId) {
          const report$ = this.reportService.getReportById(this.reportId).pipe(take(1));
          return forkJoin({ clients: clients$, report: report$, mode: of('edit') });
        } else {
          const nextId$ = this.reportService.getNextReportId(this.empresaId).pipe(take(1));
          return forkJoin({ clients: clients$, nextId: nextId$, mode: of('new') });
        }
      }),
      catchError(error => {
        console.error("Error crítico al cargar datos iniciales:", error);
        return of(null); // Emit null to signal an error state.
      })
    ).subscribe(result => {
      if (result && result.clients) {
        this.clients = result.clients;
        
        if (result.mode === 'edit') {
          const report = (result as any).report;
          if (report) {
            this.patchFormWithReportData(report);
          } else {
            console.error(`No se encontró el reporte con ID: ${this.reportId}`);
          }
        } else {
          const nextId = (result as any).nextId;
          this.reportForm.get('reporteId')?.setValue(nextId);
        }
      } 
      // This will now reliably execute, hiding the spinner.
      this.isLoading = false;
    });
  }

  
  private patchFormWithReportData(report: Report): void {
    this.reportForm.patchValue({
        ...report,
        fecha: report.fecha instanceof Timestamp ? this.formatDateToInput(report.fecha.toDate()) : this.formatDateToInput(new Date(report.fecha)),
        clientId: report.clientId
    });

    this.updateEquipos(report.clientId);
    this.reportForm.get('equipo')?.setValue(report.equipo);

    if (report.detalles) {
        this.detalles.clear();
        report.detalles.forEach(() => this.addDetalle());
        this.detalles.patchValue(report.detalles);
    }
    
    if(report.firma) {
        this.signatureDataUrl = report.firma;
        this.reportForm.get('firma')?.setValue(this.signatureDataUrl);
    }
  }

  private onClientChange(): void {
    const sub = this.reportForm.get('clientId')?.valueChanges.subscribe(clientId => {
      this.updateEquipos(clientId);
    });
    this.subscriptions.add(sub);
  }

  private updateEquipos(clientId: string | null): void {
    this.reportForm.get('equipo')?.reset();
    this.equipos = [];
    if (clientId) {
      const selectedClient = this.clients.find(c => c.id === clientId);
      if (selectedClient && selectedClient.equipos) {
        this.equipos = selectedClient.equipos;
      }
    }
  }

  private handleCostChanges(): void {
    const sub = this.detalles.valueChanges.subscribe(() => {
        const total = this.calculateTotal();
        this.reportForm.get('montoTotal')?.setValue(total, { emitEvent: false });
    });
    this.subscriptions.add(sub);
  }

  get detalles(): FormArray {
    return this.reportForm.get('detalles') as FormArray;
  }

  addDetalle(): void {
    const detalleForm = this.fb.group({
      cantidad: [1, Validators.min(1)],
      descripcion: ['', Validators.required],
      precioUnitario: [0, Validators.min(0)]
    });
    this.detalles.push(detalleForm);
  }

  removeDetalle(index: number): void {
    this.detalles.removeAt(index);
  }
  
  private setupConditionalValidation(): void {
    const firmaControl = this.reportForm.get('firma');
    const nombreFirmaControl = this.reportForm.get('nombreFirmaCliente');

    if (firmaControl && nombreFirmaControl) {
        const sub = firmaControl.valueChanges.subscribe(value => {
            if (value) {
                nombreFirmaControl.setValidators(Validators.required);
            } else {
                nombreFirmaControl.clearValidators();
            }
            nombreFirmaControl.updateValueAndValidity();
        });
        this.subscriptions.add(sub);
    }
  }

  openSignatureModal(): void {
    this.showSignatureModal = true;
  }

  onModalClosed(): void {
    this.showSignatureModal = false;
  }

  onSignatureSaved(signature: string): void {
    this.signatureDataUrl = signature;
    this.reportForm.get('firma')?.setValue(signature);
    this.showSignatureModal = false;
  }

  clearSignature(): void {
    this.signatureDataUrl = null;
    this.reportForm.get('firma')?.setValue(null);
  }

  async onSubmit(): Promise<void> {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      console.error("Formulario inválido. Detalles:", this.getFormValidationErrors());
      return;
    }
    this.isSaving = true;

    try {
      const formValue = this.reportForm.getRawValue();
      const reportData: Partial<Report> = {
        ...formValue,
        reporteId: this.isEditMode ? formValue.reporteId : this.reportForm.get('reporteId')?.value,
        empresaId: this.empresaId,
        fecha: new Date(formValue.fecha),
        montoTotal: this.calculateTotal(),
        firma: this.signatureDataUrl
      };

      if (this.isEditMode && this.reportId) {
        await this.reportService.updateReport(this.reportId, reportData);
      } else {
        await this.reportService.addReport(reportData as Report);
      }
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error("Error al guardar el reporte", error);
    } finally {
      this.isSaving = false;
    }
  }

  private calculateTotal(): number {
    return this.detalles.controls.reduce((acc, curr) => {
      const qty = curr.get('cantidad')?.value || 0;
      const price = curr.get('precioUnitario')?.value || 0;
      return acc + (qty * price);
    }, 0);
  }

  private formatDateToInput(date: Date): string {
    try {
        const pad = (n: number) => (n < 10 ? '0' + n : n);
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        return `${year}-${month}-${day}`;
    } catch (e) {
        return '';
    }
  }

  getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.reportForm.controls).forEach(key => {
      const controlErrors = this.reportForm.get(key)?.errors;
      if (controlErrors != null) {
        errors[key] = controlErrors;
      }
    });
    return errors;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
