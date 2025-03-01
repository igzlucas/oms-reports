import { Component } from '@angular/core';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
})
class ToastComponent {
  message: string = '';
  visible: boolean = false;

  // Muestra el toast con un mensaje específico
  showToast(message: string): void {
    this.message = message;
    this.visible = true;

    // Oculta automáticamente el toast después de 3 segundos
    setTimeout(() => {
      this.visible = false;
    }, 3000);
  }

  // Cierra manualmente el toast
  closeToast(): void {
    this.visible = false;
  }
}

export {ToastComponent};
