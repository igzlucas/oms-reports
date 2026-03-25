import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { switchMap, catchError, take } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

// Componentes
import { SignatureModalComponent } from '../signature-modal/signature-modal.component';

// Modelos y Servicios
import { Report } from '../../core/models/report.model';
import { Empresa } from '../../core/models/empresa.model';
import { Customer } from '../../core/models/customer.model';
import { ReportService } from '../../core/services/report.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { CustomersService } from '../../core/services/customers.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, SignatureModalComponent],
  templateUrl: './report-viewer.component.html',
  styleUrls: ['./report-viewer.component.css'],
  providers: [DatePipe],
  encapsulation: ViewEncapsulation.None
})
export class ReportViewerComponent implements OnInit {
  // Inyecciones
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);
  private empresaService = inject(EmpresaService);
  private customersService = inject(CustomersService);
  private sanitizer = inject(DomSanitizer);
  private datePipe = inject(DatePipe);
  private authService = inject(AuthService);

  // Estado del componente
  report: Report | null = null;
  empresa: Empresa | null = null;
  cliente: Customer | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  profileUserName: string = '';

  // Lógica de la firma del cliente
  showSignatureModal = false;
  clientSignatureName = '';

  // Notificación de éxito
  showSuccessMessage = false;

  ngOnInit(): void {
    this.loadCurrentUserProfile();
    this.loadReportData();
  }

  private loadCurrentUserProfile(): void {
    this.authService.user$.pipe(take(1)).subscribe(user => {
      if (user && user.displayName) {
        this.profileUserName = user.displayName;
      }
    });
  }

  private loadReportData(): void {
    const token = this.route.snapshot.paramMap.get('token') || '';
    const pin = this.route.snapshot.queryParamMap.get('pin') || '';

    if (!token || !pin) {
      this.handleLoadError('Falta información de seguridad para cargar el reporte.');
      return;
    }

    this.reportService.getReportByToken(token).pipe(
      switchMap(report => {
        if (!report || report.pin !== pin) {
          this.router.navigate(['/report-viewer', token, 'auth']);
          throw new Error('PIN incorrecto o reporte no encontrado.');
        }
        if (report.fecha instanceof Timestamp) {
          report.fecha = report.fecha.toDate();
        }
        this.report = report;

        const empresa$ = this.empresaService.getEmpresaById(report.empresaId);
        const cliente$ = this.customersService.getCustomerById(report.clientId);

        return forkJoin({ empresa: empresa$, cliente: cliente$ });
      }),
      catchError(error => {
        this.handleLoadError(error.message || 'Ocurrió un error al cargar los datos.');
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.empresa = result.empresa;
        this.cliente = result.cliente;
        if (this.report && this.report.nombreClienteFirma) {
          this.clientSignatureName = this.report.nombreClienteFirma;
        }
      }
      this.isLoading = false;
    });
  }

  // --- Lógica del Modal de Firma ---

  openSignatureModal(): void {
    if (!this.clientSignatureName.trim()) {
      // Reemplazamos el alert por un mensaje de error más sutil si es necesario en el futuro
      alert('Por favor, ingrese su nombre antes de firmar.');
      return;
    }
    this.showSignatureModal = true;
  }

  closeSignatureModal(): void {
    this.showSignatureModal = false;
  }

  onSignatureSaved(signatureDataUrl: string): void {
    if (!this.report) {
      this.handleLoadError('No se puede guardar la firma porque el reporte no está cargado.');
      return;
    }

    const reportId = this.report.id;
    this.reportService.updateClientSignature(reportId, signatureDataUrl, this.clientSignatureName)
      .then(() => {
        // Actualizar el estado local para reflejar el cambio inmediatamente
        if (this.report) {
          this.report.firmaCliente = signatureDataUrl;
          this.report.nombreClienteFirma = this.clientSignatureName;
          this.report.clientStatus = 'approved';
          this.report.status = 'completado';
        }
        this.closeSignatureModal();

        // Mostrar notificación de éxito personalizada
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 3000); // La notificación se ocultará después de 3 segundos

      })
      .catch(error => {
        console.error("Error al guardar la firma:", error);
        this.handleLoadError('Ocurrió un error al guardar la firma. Por favor, intente de nuevo.');
      });
  }

  private handleLoadError(message: string): void {
    this.errorMessage = message;
    this.isLoading = false;
  }

  // --- Funciones de Ayuda para la Plantilla ---

  getFormattedDate(date: any, format: string = 'dd/MM/yyyy'): string | null {
    if (!date) return null;
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return this.datePipe.transform(jsDate, format);
  }

  getSanitizedUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getTotalDetalles(): number {
    if (!this.report || !this.report.detalles) return 0;
    return this.report.detalles.reduce((total, item) => 
      total + (Number(item.cantidad) * Number(item.precioUnitario)), 0);
  }
}
