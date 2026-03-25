import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Report } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { ClientService } from '../../core/services/client.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Timestamp } from 'firebase/firestore';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, take, switchMap } from 'rxjs/operators';

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
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  stats$!: Observable<{ totalReports: number; totalClients: number; }>;
  recentReports$!: Observable<ReportWithClientName[]>;
  
  recentActivity: ActivityItem[] = []; // Inicializamos vacío
  currentYear: number = new Date().getFullYear();

  ngOnInit(): void {
    // Usamos switchMap para una cadena más limpia y segura
    this.empresaService.getEmpresa().pipe(
      switchMap(empresa => {
        if (empresa && empresa.id) {
          const empresaId = empresa.id;
          // Disparamos la carga de todas las estadísticas y reportes
          this.loadStats(empresaId);
          this.loadRecentReports(empresaId);
        }
        return of(null); // Evita que la cadena se rompa si no hay empresa
      }),
      catchError(err => {
        console.error('Error al obtener la empresa en el Dashboard:', err);
        return of(null);
      })
    ).subscribe(); // La suscripción es necesaria para que el pipe se ejecute
  }

  loadStats(empresaId: string): void {
    // Usamos los nuevos métodos de conteo directo para eficiencia y precisión
    this.stats$ = forkJoin({
      totalReports: this.reportService.getReportsCountByEmpresa(empresaId).pipe(catchError(() => of(0))),
      totalClients: this.clientService.getClientsCountByEmpresa(empresaId).pipe(catchError(() => of(0)))
    });
  }

  loadRecentReports(empresaId: string): void {
    this.recentReports$ = forkJoin({
        // Tomamos los 5 reportes más recientes
        reports: this.reportService.getReportsByEmpresa(empresaId, 5).pipe(take(1)),
        // Obtenemos todos los clientes para mapear nombres
        clients: this.clientService.getClientsByEmpresa(empresaId).pipe(take(1))
      }).pipe(
        map(({ reports, clients }) => {
          const clientMap = new Map(clients.map(c => [c.id, c.nombre]));
          return reports.map(report => ({
            ...report,
            clientName: clientMap.get(report.clientId) || 'Cliente Desconocido'
          }));
        }),
        catchError(() => of([])) // En caso de error, devolvemos una lista vacía
      );
  }

  getFormattedDate(date: any): string | null {
    if (!date) return null;
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return this.datePipe.transform(jsDate, 'dd/MM/yyyy');
  }

  goToReportDetail(reportId: string): void {
    if (reportId) {
      this.router.navigate(['/reports', reportId]);
    }
  }

  goToNewReport(): void {
    this.router.navigate(['/new-report']);
  }
}
