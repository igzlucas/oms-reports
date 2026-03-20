import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Report } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { ClientService } from '../../core/services/client.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Timestamp } from 'firebase/firestore';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';

interface ReportWithClientName extends Report {
  clientName: string;
}

interface ActivityItem {
  description: string;
  time: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [DatePipe],
})
export class DashboardComponent implements OnInit {
  private reportService = inject(ReportService);
  private clientService = inject(ClientService);
  private empresaService = inject(EmpresaService);
  // VOLVEMOS A HACERLO PRIVADO. Es la forma correcta.
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  stats$!: Observable<{ totalReports: number; totalClients: number; }>;
  recentReports$!: Observable<ReportWithClientName[]>;
  
  recentActivity: ActivityItem[] = [
    { description: 'Nuevo reporte para Cliente A', time: 'Hace 5 minutos', icon: 'assets/images/report-icon.svg' },
    { description: 'Nuevo cliente: Cliente B', time: 'Hace 2 horas', icon: 'assets/images/client-icon.svg' },
  ];
  currentYear: number = new Date().getFullYear();

  ngOnInit(): void {
    this.empresaService.getEmpresa().pipe(take(1)).subscribe(empresa => {
      if (empresa && empresa.id) {
        const empresaId = empresa.id;
        this.loadStats(empresaId);
        this.loadRecentReports(empresaId);
      }
    });
  }

  loadStats(empresaId: string): void {
    this.stats$ = forkJoin({
      totalReports: this.reportService.getReportsByEmpresa(empresaId).pipe(take(1), map(r => r.length), catchError(() => of(0))),
      totalClients: this.clientService.getClientsByEmpresa(empresaId).pipe(take(1), map(c => c.length), catchError(() => of(0)))
    });
  }

  loadRecentReports(empresaId: string): void {
    this.recentReports$ = forkJoin({
        reports: this.reportService.getReportsByEmpresa(empresaId, 5).pipe(take(1)),
        clients: this.clientService.getClientsByEmpresa(empresaId).pipe(take(1))
      }).pipe(
        map(({ reports, clients }) => {
          const clientMap = new Map(clients.map(c => [c.id, c.nombre]));
          return reports.map(report => ({
            ...report,
            clientName: clientMap.get(report.clientId) || 'Cliente Desconocido'
          }));
        }),
        catchError(() => of([]))
      );
  }

  getFormattedDate(date: any): string | null {
    if (!date) return null;
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return this.datePipe.transform(jsDate, 'dd/MM/yyyy');
  }

  // Método para la navegación que ya existía
  goToReportDetail(reportId: string): void {
    if (reportId) {
      this.router.navigate(['/reports', reportId]);
    }
  }

  // MÉTODO PÚBLICO CORRECTO para que el template lo pueda llamar
  goToNewReport(): void {
    this.router.navigate(['/reports/new']);
  }
}
