import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Report } from '../../../core/models/report.model';
import { ReportService } from '../../../core/services/report.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { switchMap } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';
import { Empresa } from '../../../core/models/empresa.model';
import { Clipboard } from '@angular/cdk/clipboard';

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
  private clipboard = inject(Clipboard);
  private router = inject(Router);

  reports: Report[] = [];
  copiedState: { type: 'pin' | 'link'; id: string } | null = null;

  ngOnInit(): void {
    this.empresaService.getEmpresa().pipe(
      switchMap((empresa: Empresa | null) => {
        if (empresa && empresa.id) {
          return this.reportService.getReportsByEmpresa(empresa.id);
        }
        return [];
      })
    ).subscribe((reports: Report[]) => {
      this.reports = reports.sort((a, b) => b.reporteId - a.reporteId);
    });
  }

  // --- NUEVA FUNCIÓN PARA ELIMINAR REPORTES ---
  async deleteReport(reportId: string, event: MouseEvent): Promise<void> {
    event.stopPropagation(); // Detenemos cualquier otro evento de clic.

    const confirmation = window.confirm('¿Estás seguro de que quieres eliminar este reporte? Esta acción no se puede deshacer.');

    if (confirmation) {
      try {
        await this.reportService.deleteReport(reportId);
        // Eliminamos el reporte de la lista local para actualizar la vista al instante.
        this.reports = this.reports.filter(report => report.id !== reportId);
        console.log('Reporte eliminado con éxito.');
        // Aquí podrías añadir una notificación Toast para el usuario.
      } catch (error) {
        console.error('Error al eliminar el reporte:', error);
        // Y aquí, una notificación de error.
      }
    }
  }

  getFormattedDate(date: any): string | null {
    if (!date) return null;
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return this.datePipe.transform(jsDate, 'dd/MM/yyyy');
  }

  copyPin(pin: string, reportId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.clipboard.copy(pin);
    this.setCopiedState('pin', reportId);
  }

  copyShareLink(report: Report, event: MouseEvent): void {
    event.stopPropagation();
    const link = this.getShareableLink(report);
    if (link) {
      this.clipboard.copy(link);
      this.setCopiedState('link', report.id);
    }
  }

  getShareableLink(report: Report): string | null {
    if (!report.publicLinkToken) {
      console.warn('Este reporte no tiene un token público para compartir.', report);
      return null;
    }
    return `${window.location.origin}/report-viewer/${report.publicLinkToken}/auth`;
  }

  private setCopiedState(type: 'pin' | 'link', id: string): void {
    this.copiedState = { type, id };
    setTimeout(() => {
      if (this.copiedState && this.copiedState.id === id) {
        this.copiedState = null;
      }
    }, 2000);
  }
}
