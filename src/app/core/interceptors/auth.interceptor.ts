import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const auth: Auth = inject(Auth);
  const user = auth.currentUser;

  // If there's no user, proceed without a token
  if (!user) {
    return next(req);
  }

  // Get the ID token, which is an async operation.
  // The Firebase SDK automatically handles token refreshing.
  return from(user.getIdToken()).pipe(
    switchMap(token => {
      // If a token is retrieved, clone the request and add the Authorization header.
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedReq);
      }
      // If for some reason no token is retrieved, proceed with the original request.
      return next(req);
    })
  );
};
