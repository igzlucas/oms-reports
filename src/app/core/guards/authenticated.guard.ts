import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

export const authenticatedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const auth = inject(Auth);

  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        router.navigate(['/dashboard']);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
