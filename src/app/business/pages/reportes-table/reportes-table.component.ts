import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Report } from '../../../core/models/report.model';
import { ReportService } from '../../../core/services/report.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { switchMap } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';
import { Empresa } from '../../../core/models/empresa.model';

@Component({
  selector: 'app-reportes-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reportes-table.component.html',
  styleUrls: ['./reportes-table.component.css'],
  providers: [DatePipe]
})
export class ReportesTableComponent implements OnInit {
  private reportService = inject(ReportService);
  private empresaService = inject(EmpresaService);
  private datePipe = inject(DatePipe);

  reports: Report[] = [];

  ngOnInit(): void {
    this.empresaService.getEmpresa().pipe(
      switchMap((empresa: Empresa | null) => {
        if (empresa && empresa.id) {
          return this.reportService.getReportsByEmpresa(empresa.id);
        }
        return [];
      })
    ).subscribe((reports: Report[]) => {
      this.reports = reports;
    });
  }

  getFormattedDate(date: any): string | null {
    if (!date) return null;
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return this.datePipe.transform(jsDate, 'dd/MM/yyyy');
  }

  getShareableLink(report: Report): string {
    const pin = report.pin || '';
    const token = report.publicLinkToken || '';
    return `${window.location.origin}/report-viewer/${token}/auth?pin=${pin}`;
  }

  copyToClipboard(input: HTMLInputElement): void {
    input.select();
    document.execCommand('copy');
    input.setSelectionRange(0, 0);
    // Considera añadir una notificación de que se ha copiado
  }

  shareReport(report: Report): void {
    const link = this.getShareableLink(report);
    // Aquí podrías usar la API de Share si el navegador la soporta,
    // o mostrar un modal con el enlace para copiar.
    if (navigator.share) {
      navigator.share({
        title: `Reporte de Servicio #${report.reporteId}`,
        text: `Accede al reporte de servicio para el cliente.`,
        url: link,
      })
      .catch(console.error);
    } else {
      // Fallback para navegadores que no soportan la API de Share
      alert(`Copia este enlace para compartir: ${link}`);
    }
  }
}
