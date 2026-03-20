import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';

import { Report, Detalle } from '../../../core/models/report.model';
import { Client, Equipment } from '../../../core/models/client.model';
import { ReportService } from '../../../core/services/report.service';
import { ClientService } from '../../../core/services/client.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { SignatureModalComponent } from '../../../shared/signature-modal/signature-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SignatureModalComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  providers: [DatePipe]
})
export class ReportsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private empresaService = inject(EmpresaService);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);

  currentReport: Partial<Report> = {};
  clients: Client[] = [];
  equipments: Equipment[] = [];
  empresaId!: string;
  isEditMode = false;
  newDetail: Partial<Detalle> = { cantidad: 1, descripcion: '', precioUnitario: 0 };

  ngOnInit(): void {
    this.empresaService.getEmpresa().pipe(
      switchMap(empresa => {
        if (!empresa || !empresa.id) {
          throw new Error('Empresa o ID de empresa no encontrado');
        }
        this.empresaId = empresa.id;
        this.clientService.getClientsByEmpresa(this.empresaId).subscribe(clients => this.clients = clients);

        return this.route.paramMap;
      }),
      switchMap(params => {
        const id = params.get('id');
        // SOLUCIÓN: Verificamos que el ID exista y no sea la palabra 'new'
        if (id && id.toLowerCase() !== 'new') {
          this.isEditMode = true;
          return this.reportService.getReportById(id);
        }
        // Si no hay ID o es 'new', estamos en modo de creación
        this.isEditMode = false;
        return this.reportService.getNextReportId(this.empresaId).pipe(
          switchMap(nextId => of({ reporteId: nextId, fecha: new Date() } as Partial<Report>))
        );
      })
    ).subscribe(report => {
      if (report) {
        if (report.fecha && report.fecha instanceof Timestamp) {
            report.fecha = report.fecha.toDate();
        }
        this.currentReport = report;
        if (!this.currentReport.detalles) {
          this.currentReport.detalles = [];
        }
        if (this.currentReport.clientId) {
          this.loadEquipments(this.currentReport.clientId);
        }
      } else {
        this.resetForm();
      }
    });
  }

  getFormattedDate(date: any): string | null {
    if (!date) {
      return '';
    }
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return this.datePipe.transform(jsDate, 'dd/MM/yyyy h:mm a');
  }

  resetForm(reporteId?: number): void {
    this.reportService.getNextReportId(this.empresaId).subscribe(nextId => {
        this.currentReport = {
            reporteId: reporteId || nextId,
            empresaId: this.empresaId,
            status: 'borrador',
            fecha: new Date(),
            detalles: [],
            moneda: 'USD',
            diasGarantia: 30,
            montoTotal: 0,
        };
    });
  }

  onClientChange(clientId: string): void {
    this.loadEquipments(clientId);
  }

  loadEquipments(clientId: string): void {
    const client = this.clients.find(c => c.id === clientId);
    this.equipments = client?.equipos || [];
  }

  addDetail(): void {
    if (this.newDetail.descripcion && this.newDetail.cantidad! > 0) {
      if (!this.currentReport.detalles) this.currentReport.detalles = [];
      this.currentReport.detalles.push({ ...this.newDetail } as Detalle);
      this.newDetail = { cantidad: 1, descripcion: '', precioUnitario: 0 };
      this.calculateTotal();
    }
  }

  removeDetail(index: number): void {
    if (this.currentReport.detalles) {
      this.currentReport.detalles.splice(index, 1);
      this.calculateTotal();
    }
  }

  calculateTotal(): void {
    this.currentReport.montoTotal = this.currentReport.detalles?.reduce(
      (acc, detail) => acc + (detail.cantidad * detail.precioUnitario),
      0
    ) || 0;
  }

  openSignatureModal(): void {
    const dialogRef = this.dialog.open(SignatureModalComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.currentReport.firma = result;
      }
    });
  }

  async saveReport(form: NgForm, finalize = false): Promise<void> {
    if (form.invalid) return;

    const reportToSave = { ...this.currentReport };

    if (finalize) {
      reportToSave.status = 'completado';
      reportToSave.clientStatus = 'pending';
      if (!reportToSave.publicLinkToken) {
        reportToSave.publicLinkToken = uuidv4();
        reportToSave.pin = Math.floor(1000 + Math.random() * 9000).toString();
      }
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 30); // 30 días de validez
      reportToSave.publicLinkExpiresAt = Timestamp.fromDate(expiration);
    }

    if (reportToSave.fecha && reportToSave.fecha instanceof Date) {
      reportToSave.fecha = Timestamp.fromDate(reportToSave.fecha);
    }

    try {
      if (this.isEditMode && reportToSave.id) {
        await this.reportService.updateReport(reportToSave.id, reportToSave);
      } else {
        await this.reportService.addReport(reportToSave as Report);
      }
      this.router.navigate(['/reports-table']);
    } catch (error) {
      console.error("Error al guardar el reporte:", error);
    }
  }

  cancel(): void {
    this.router.navigate(['/reports-table']);
  }
}
