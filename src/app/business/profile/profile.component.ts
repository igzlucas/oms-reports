import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  isLoading = true;
  name = '';
  correo = '';
  rol = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.name = user.displayName || '';
        this.correo = user.email || '';
        this.authService.getCurrentUserToken().subscribe(token => {
          this.rol = token.claims['role'] || 'user';
          this.isLoading = false;
        });
      }
    });
  }
}
