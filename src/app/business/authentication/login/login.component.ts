import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

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
    private toastr: ToastrService
  ) {}

  // Simplified login success handler
  private handleLoginSuccess(): void {
    this.toastr.success('¡Bienvenido!', 'Inicio de Sesión Exitoso');
    this.router.navigate(['/dashboard']);
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.handleLoginSuccess();
      },
      error: (error: any) => {
        console.error('Login error', error);
        this.toastr.error(
          'Hubo un problema al iniciar sesión con Google.',
          'Error de Autenticación'
        );
      },
    });
  }

  loginWithEmail(): void {
    if (!this.email || !this.password) {
      this.toastr.warning(
        'Por favor, ingresa tu correo y contraseña.',
        'Campos Incompletos'
      );
      return;
    }

    this.authService.loginWithEmail(this.email, this.password).subscribe({
      next: () => {
        this.handleLoginSuccess();
      },
      error: (error: any) => {
        console.error('Login error', error);
        this.toastr.error(
          'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.',
          'Error de Autenticación'
        );
      },
    });
  }

  resetPassword(): void {
    if (!this.email) {
      this.toastr.info(
        'Por favor, ingresa tu dirección de correo para restablecer la contraseña.',
        'Restablecer Contraseña'
      );
      return;
    }

    this.authService.resetPassword(this.email).subscribe({
      next: () => {
        this.toastr.success(
          'Se ha enviado un enlace a tu correo para restablecer la contraseña.',
          'Revisa tu Email'
        );
      },
      error: (err: any) => {
        console.error('Password reset error', err);
        this.toastr.error(
          'Hubo un problema al intentar restablecer la contraseña.',
          'Error'
        );
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
