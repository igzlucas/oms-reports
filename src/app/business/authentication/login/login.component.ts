import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  formMode: 'login' | 'forgotPassword' = 'login';
  fecha = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  private handleLoginSuccess(): void {
    this.toastService.show('¡Bienvenido!', 'success');
    this.router.navigate(['/dashboard']);
  }

  loginWithEmail(): void {
    if (!this.email || !this.password) {
      this.toastService.show('Por favor, ingresa tu correo y contraseña.', 'info');
      return;
    }

    this.authService.loginWithEmail(this.email, this.password).subscribe({
      next: () => {
        this.handleLoginSuccess();
      },
      error: (error: any) => {
        console.error('Login error', error);
        this.toastService.show('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.', 'error');
      },
    });
  }

  resetPassword(): void {
    if (!this.email) {
      this.toastService.show('Por favor, ingresa tu dirección de correo para restablecer la contraseña.', 'info');
      return;
    }

    this.authService.resetPassword(this.email).subscribe({
      next: () => {
        this.toastService.show('Enlace enviado. Serás redirigido al inicio de sesión.', 'success');
        this.showLoginForm();
      },
      error: (err: any) => {
        console.error('Password reset error', err);
        this.toastService.show('Hubo un problema al intentar restablecer la contraseña.', 'error');
      },
    });
  }

  showForgotPassword(): void {
    this.formMode = 'forgotPassword';
  }

  showLoginForm(): void {
    this.formMode = 'login';
  }
}
