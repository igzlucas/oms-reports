import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: any): boolean {
    const role = this.authService.getUserRole(); // Obtén el rol directamente
    if (role && route.data?.roles?.includes(role)) {
      return true;
    }
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
