import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, first } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    first(), // Reemplaza a take(1). Espera la primera emisión definitiva del estado de autenticación.
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true; // Si el usuario está autenticado, permite el acceso.
      } else {
        router.navigate(['/login']); // Si no lo estacute;, redirige al login.
        return false;
      }
    })
  );
};
