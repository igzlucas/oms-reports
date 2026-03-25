import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { switchMap, catchError, of, tap } from 'rxjs';

// Services and Models
import { ReportService } from '../../core/services/report.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa } from '../../core/models/empresa.model';
import { Report } from '../../core/models/report.model';

@Component({
  selector: 'app-report-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page-wrapper">
      <div *ngIf="isLoading" class="loading-spinner"></div>

      <div *ngIf="!isLoading && empresa" class="auth-card">
        <img *ngIf="empresa.logoUrl" [src]="getSanitizedUrl(empresa.logoUrl)" alt="Logo de {{ empresa.nombre }}" class="company-logo">
        <h2 class="company-name">{{ empresa.nombre }}</h2>
        
        <h3>Verificación de Seguridad</h3>
        <p>Por favor, introduce el PIN de acceso para visualizar el reporte.</p>
        
        <div class="input-group">
          <input 
            type="password" 
            [(ngModel)]="pin" 
            (keyup.enter)="verifyPin()"
            placeholder="Introduce tu PIN" 
            class="pin-input"
            autocomplete="off"
            >
          <button (click)="verifyPin()" class="verify-button">Ver Reporte</button>
        </div>
        
        <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>

      <div *ngIf="!isLoading && authError" class="auth-card">
          <h2 class="company-name">Error</h2>
          <p class="error-message">{{ authError }}</p>
          <p>No se pudo cargar la información del reporte. El enlace puede ser inválido o haber expirado.</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background-color: #f4f7f6;
      height: 100vh;
      width: 100vw;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .auth-page-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
    .auth-card {
      background: #fff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 450px;
      text-align: center;
      transition: all 0.3s ease;
    }
    .company-logo {
      max-width: 150px;
      max-height: 80px;
      /* MODIFICACIÓN: Centrado horizontal y margen inferior */
      margin: 0 auto 20px;
      object-fit: contain;
      display: block; /* Asegura que el margen auto funcione correctamente */
    }
    .company-name {
      font-size: 1.5em;
      color: #333;
      font-weight: 600;
      margin-bottom: 30px;
    }
    h3 {
      font-size: 1.2em;
      color: #555;
      margin-bottom: 10px;
    }
    p {
      color: #666;
      margin-bottom: 25px;
    }
    .input-group {
      display: flex;
      flex-direction: column;
    }
    .pin-input {
      width: 100%;
      padding: 12px 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1em;
      text-align: center;
      margin-bottom: 20px;
      box-sizing: border-box; /* Important */
    }
    .verify-button {
      width: 100%;
      padding: 12px 15px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .verify-button:hover {
      background-color: #0056b3;
    }
    .error-message {
      color: #d9534f;
      margin-top: 15px;
      font-weight: bold;
    }
    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ReportAuthComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);
  private empresaService = inject(EmpresaService);
  private sanitizer = inject(DomSanitizer);

  // Component State
  pin: string = '';
  token: string = '';
  errorMessage: string = '';
  authError: string | null = null; // For critical errors like invalid token
  
  isLoading: boolean = true;
  empresa: Empresa | null = null;
  private report: Report | null = null; // Store the report to avoid refetching

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.authError = 'Token de reporte no proporcionado.';
      this.isLoading = false;
      return;
    }
    this.loadCompanyData();
  }

  loadCompanyData(): void {
    this.isLoading = true;
    this.reportService.getReportByToken(this.token).pipe(
      tap(report => {
        if (!report) {
          throw new Error('Reporte no encontrado o token inválido.');
        }
        this.report = report; // Save the report
      }),
      switchMap(report => {
        if (!report) {
            // This case should be handled by the tap/catchError, but for safety:
            return of(null);
        }
        return this.empresaService.getEmpresaById(report.empresaId);
      }),
      catchError(error => {
        this.authError = 'No se pudo cargar la información del reporte. Verifique que el enlace sea correcto.';
        console.error('Error loading report/company data:', error);
        return of(null);
      })
    ).subscribe(empresa => {
      this.empresa = empresa;
      this.isLoading = false;
    });
  }

  verifyPin(): void {
    if (!this.pin) {
      this.errorMessage = 'Por favor, introduce un PIN.';
      return;
    }
    // Use the already fetched report
    if (this.report && this.report.pin === this.pin) {
      this.router.navigate(['/report-viewer', this.token, 'view'], { queryParams: { pin: this.pin } });
    } else {
      this.errorMessage = 'PIN incorrecto. Por favor, inténtalo de nuevo.';
      this.pin = ''; // Clear the input
    }
  }

  // Helper for safe URLs
  getSanitizedUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
