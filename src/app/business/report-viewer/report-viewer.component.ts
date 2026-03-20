import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../core/services/report.service';
import { Report } from '../../core/models/report.model';
import { switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Timestamp } from 'firebase/firestore';
import { SignatureModalComponent } from '../../shared/signature-modal/signature-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule, SignatureModalComponent],
  templateUrl: './report-viewer.component.html',
  styleUrls: ['./report-viewer.component.css'],
  providers: [DatePipe]
})
export class ReportViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reportService = inject(ReportService);
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  report: Report | null = null;
  isLinkExpired = false;
  isPinValid = false;

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') || '';
    const pin = this.route.snapshot.queryParamMap.get('pin') || '';

    this.reportService.getReportByToken(token).subscribe(report => {
      if (report) {
        if (report.publicLinkExpiresAt && report.publicLinkExpiresAt.toDate() < new Date()) {
          this.isLinkExpired = true;
          return;
        }

        if (report.pin === pin) {
          this.isPinValid = true;
          if (report.fecha instanceof Timestamp) {
            report.fecha = report.fecha.toDate();
          }
          this.report = report;
        } else {
          // Redirigir a la página de autenticación si el PIN es incorrecto
          this.router.navigate(['/report-viewer', token]);
        }
      } else {
        // Manejar el caso en que el reporte no se encuentra
      }
    });
  }

  getFormattedDate(date: any): string | null {
    if (!date) {
        return '';
    }
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return this.datePipe.transform(jsDate, 'yyyy-MM-dd HH:mm');
  }

  approveReport(): void {
    if (this.report && this.report.id) {
        this.report.clientStatus = 'approved';
        const reportToUpdate = { ...this.report };
        if (reportToUpdate.fecha instanceof Date) {
            reportToUpdate.fecha = Timestamp.fromDate(reportToUpdate.fecha);
        }
        this.reportService.updateReport(this.report.id, reportToUpdate);
    }
  }

  openSignatureModal(): void {
    const dialogRef = this.dialog.open(SignatureModalComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.report && this.report.id) {
        this.report.firma = result;
        const reportToUpdate = { ...this.report };
        if (reportToUpdate.fecha instanceof Date) {
            reportToUpdate.fecha = Timestamp.fromDate(reportToUpdate.fecha);
        }
        this.reportService.updateReport(this.report.id, reportToUpdate);
      }
    });
  }

  getSanitizedUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
