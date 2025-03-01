import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EncryptService } from '../../../core/services/encrypt.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export default class LoginComponent implements OnInit {
  user: string = '';
  password: string = '';
  errorMessage: string = '';
  fecha: string = '';
  constructor(private authService: AuthService, private router: Router, private encryptService: EncryptService) {}


  ngOnInit(){
    
    this.fecha = new Date().getFullYear().toString();
   
  }


  login(): void {
    // Validar que los campos no estén vacíos
    if (!this.user.trim() || !this.password.trim()) {
      this.showAlert('Por favor, complete todos los campos.');
      return;
    }
    if (!this.isValidEmail(this.user)) {
      this.showAlert('El usuario debe ser un correo electrónico válido.');
      return;

    }
    
    this.authService.login(this.encryptService.cifrarRsa(this.user), this.encryptService.cifrarRsa(this.password)).subscribe({
      next: (response) => {
        const token = response.token;
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = this.encryptService.descifrarAes(payload.role);
        if (role === 'ROLE_ADMIN') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/profile']);
        }
      },
      error: (err) => {
        if (err.status === 401) {
          this.showAlert(err.error.detalles);
        } else {
          this.showAlert('Ocurrió un error. Intente nuevamente.');
        }
      },
    });
  }

  private showAlert(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = ''; // Oculta la alerta después de 3 segundos
    }, 3000);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^@]+@[^@]+\.[a-zA-Z]{2,5}$/;
    return emailRegex.test(email);
  }
}
