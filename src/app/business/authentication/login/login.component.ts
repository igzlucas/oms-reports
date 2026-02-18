import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  fecha: string = '';
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  formMode: 'login' | 'forgotPassword' = 'login'; // Estado para controlar el formulario

  constructor(private authService: AuthService, private router: Router) {
    this.fecha = new Date().getFullYear().toString();
  }

  ngOnInit(): void {
    if (localStorage.getItem('rememberMe') === 'true') {
      this.email = localStorage.getItem('email') || '';
      this.rememberMe = true;
    }
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed', err);
      },
    });
  }

  loginWithEmail(): void {
    this.authService.loginWithEmail(this.email, this.password).subscribe({
      next: () => {
        if (this.rememberMe) {
          localStorage.setItem('email', this.email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('email');
          localStorage.removeItem('rememberMe');
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed', err);
        alert('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      },
    });
  }

  // Cambia al modo de recuperación de contraseña
  showForgotPassword(): void {
    this.formMode = 'forgotPassword';
  }

  // Vuelve al formulario de login
  showLoginForm(): void {
    this.formMode = 'login';
  }

  // Envía el correo de restablecimiento
  async resetPassword(): Promise<void> {
    if (!this.email) {
      alert('Por favor, ingresa tu correo electrónico para restablecer la contraseña.');
      return;
    }

    try {
      await this.authService.forgotPassword(this.email).toPromise();
      alert('Se ha enviado un correo para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada.');
      this.showLoginForm(); // Vuelve al login después de enviar
    } catch (err) {
      console.error('Password reset failed', err);
      alert('Hubo un error al intentar restablecer la contraseña. Por favor, inténtalo de nuevo.');
    }
  }
}
