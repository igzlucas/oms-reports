import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) {
    const newToast: Toast = { message, type, duration };
    this.toasts.update(currentToasts => [newToast, ...currentToasts]);

    if (duration > 0) {
      setTimeout(() => this.remove(newToast), duration);
    }
  }

  remove(toast: Toast) {
    this.toasts.update(currentToasts => currentToasts.filter(t => t !== toast));
  }
}
