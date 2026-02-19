import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  // Aplica estas clases directamente al elemento host <app-toast>
  @HostBinding('class') classes = 'fixed top-5 right-5 z-50';

  constructor(public toastService: ToastService) {}
}
