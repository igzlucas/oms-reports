import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { User, updateProfile } from 'firebase/auth';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);

  public user$: Observable<User | null>;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.user$ = new Observable<User | null>(observer => {
        const unsubscribe = onAuthStateChanged(this.auth, observer);
        return unsubscribe;
      }).pipe(
        tap(user => console.log('[DEBUG] AuthService: user$ emitted ->', user ? user.email : 'null')),
        shareReplay(1)
      );
    } else {
      this.user$ = of(null);
    }
  }

  loginWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      map(() => void 0), // We don't need to check and create user anymore.
      catchError((error) => {
        this.notificationService.show('Error de Autenticación: Hubo un problema al iniciar sesión con Google.', 'error');
        console.error('Login failed:', error);
        throw error;
      })
    );
  }

  loginWithEmail(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      catchError((error) => {
        let message = 'Error de Autenticación: Verifique su correo y contraseña.';
        if (error.code === 'auth/user-not-found') {
          message = 'El usuario no fue encontrado.';
        } else if (error.code === 'auth/wrong-password') {
          message = 'La contraseña es incorrecta.';
        }
        this.notificationService.show(message, 'error');
        console.error('Login failed:', error);
        throw error;
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      tap(() => {
        if (isPlatformBrowser(this.platformId)) {
            this.router.navigate(['/login']);
        }
      })
    );
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map(user => user !== null));
  }

  forgotPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      tap(() => {
        this.notificationService.show('Se ha enviado un correo para restablecer su contraseña.', 'success');
      }),
      catchError((error) => {
        this.notificationService.show('Error al enviar el correo de restablecimiento.', 'error');
        throw error;
      })
    );
  }

  resetPassword(email: string): Observable<void> {
    return this.forgotPassword(email);
  }

  updateProfile(profile: { displayName: string }): Observable<void> {
    const user = this.auth.currentUser;
    if (!user) {
      return of(undefined);
    }
    return from(updateProfile(user, profile));
  }
}
