import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);  // Inyecta el servicio de autenticación
  const token = authService.getTokenForInterceptor();  // Obtén el token

  if (token) {
    const cloned = req.clone({
      headers: req.headers.delete('Some-Unnecessary-Header'),
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(cloned).pipe(
      catchError((error) => {
        // Si el error es por un token expirado (por ejemplo, 401)
        if (error.status === 401) {
          return authService.refreshToken().pipe(  // Llama al servicio de refresh token
            switchMap((newToken: string) => {
              // Si se obtiene un nuevo token, se clona la solicitud con el nuevo token
              const clonedReqWithNewToken = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(clonedReqWithNewToken);  // Reintenta la solicitud original con el nuevo token
            }),
            catchError((refreshError) => {
              // Si el refresh token también falla, redirigir a login o manejar el error
              authService.logout();
              return throwError(() => new Error('Session expired, please log in again'));
            })
          );
        }
        return throwError(() => error);  // Si el error no es por 401, lo reenvía
      })
    );
  }

  return next(req);  // Si no hay token, simplemente pasa la solicitud original
};
