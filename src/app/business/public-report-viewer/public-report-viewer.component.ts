import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, switchMap, map } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

// Core
import { ReportService } from '../../core/services/report.service';
import { Report } from '../../core/models/report.model';
import { SafeHtmlPipe } from '../../core/pipes/safe-html.pipe';

@Component({
  selector: 'app-public-report-viewer',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule, 
    SafeHtmlPipe
  ],
  templateUrl: './public-report-viewer.component.html',
  styleUrls: ['./public-report-viewer.component.css'],
})
export class PublicReportViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);
  private fb = inject(FormBuilder);

  report$: Observable<Report | null> | undefined;
  reportData: Report | null = null;

  isLoading = true;
  error: string | null = null;
  
  pinForm!: FormGroup;
  pinVerified = false;
  pinError: string | null = null;

  ngOnInit(): void {
    this.report$ = this.route.paramMap.pipe(
      switchMap(params => {
        const token = params.get('token');
        if (!token) {
          this.handleInvalidData('URL inválida o token no proporcionado.');
          return of(null);
        }
        return this.reportService.getReportByToken(token);
      }),
      map(report => {
        if (!report) {
          this.handleInvalidData('El reporte solicitado no existe.');
          return null;
        }

        const now = Timestamp.now();
        const expiresAt = report.publicLinkExpiresAt;
        if (expiresAt && now.toMillis() > expiresAt.toMillis()) {
          this.handleInvalidData('Este enlace ha expirado.');
          return null;
        }
        
        this.isLoading = false;
        this.reportData = report;
        return this.reportData;
      })
    );

    this.pinForm = this.fb.group({
      pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]]
    });
  }

  verifyPin(): void {
    if (this.pinForm.invalid) {
      this.pinError = 'Por favor, ingrese un PIN de 6 dígitos.';
      return;
    }

    const enteredPin = this.pinForm.value.pin;
    if (this.reportData && this.reportData.pin === enteredPin) {
      this.pinVerified = true;
      this.pinError = null;
    } else {
      this.pinError = 'El PIN es incorrecto. Intente de nuevo.';
      this.pinVerified = false;
    }
  }

  private handleInvalidData(message: string): void {
    this.error = message;
    this.isLoading = false;
  }
  
  formatDate(date: Date | Timestamp | undefined): string {
    if (!date) return 'N/A';
    const d = (date instanceof Timestamp) ? date.toDate() : date;
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(d);
  }

  // NUEVA FUNCIÓN PARA OBTENER EL AÑO
  getYear(date: Date | Timestamp | undefined): string {
    if (!date) {
      return new Date().getFullYear().toString();
    }
    const d = (date instanceof Timestamp) ? date.toDate() : date;
    return d.getFullYear().toString();
  }
}
