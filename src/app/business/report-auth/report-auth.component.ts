import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../core/services/report.service';

@Component({
  selector: 'app-report-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <h2>Verificación de Seguridad</h2>
      <p>Por favor, introduce el PIN para ver el reporte.</p>
      <input type="text" [(ngModel)]="pin" placeholder="Introduce tu PIN">
      <button (click)="verifyPin()">Ver Reporte</button>
      <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  `,
  styles: [`
    .auth-container { max-width: 400px; margin: 50px auto; padding: 20px; text-align: center; }
    .error-message { color: red; }
  `]
})
export class ReportAuthComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);

  pin: string = '';
  token: string = '';
  errorMessage: string = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  verifyPin(): void {
    this.reportService.getReportByToken(this.token).subscribe(report => {
      if (report && report.pin === this.pin) {
        this.router.navigate(['/report-viewer', this.token, 'view'], { queryParams: { pin: this.pin } });
      } else {
        this.errorMessage = 'PIN incorrecto. Por favor, inténtalo de nuevo.';
      }
    });
  }
}
