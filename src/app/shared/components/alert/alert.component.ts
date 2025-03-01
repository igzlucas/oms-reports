import { Component, Input  } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
})


export class  AlertComponent {
  @Input() isVisible = false;
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';

  showAlert(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    this.type = type;
    this.message = message;
    this.isVisible = true;

    // Oculta automáticamente la alerta después de 5 segundos
    setTimeout(() => {
      this.isVisible = false;
    }, 5000);
  }

  closeAlert() {
    this.isVisible = false;
  }
}
