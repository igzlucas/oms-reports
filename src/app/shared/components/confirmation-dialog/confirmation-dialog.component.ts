import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  isVisible = false;
  message = '';
  private resolve?: (value: boolean) => void;
  private subscription!: Subscription;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.subscription = this.confirmationService.confirmationState$.subscribe(state => {
      this.message = state.message;
      this.resolve = state.resolve;
      this.isVisible = true;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onConfirm(): void {
    if (this.resolve) {
      this.resolve(true);
    }
    this.reset();
  }

  onCancel(): void {
    if (this.resolve) {
      this.resolve(false);
    }
    this.reset();
  }

  private reset(): void {
    this.isVisible = false;
    this.message = '';
    this.resolve = undefined;
  }
}
