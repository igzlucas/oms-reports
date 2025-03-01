import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, throwError, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EncryptService } from '../../core/services/encrypt.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private LOGIN_URL = 'http://localhost:8082/api/v1/auth/login';
  //private LOGIN_URL = 'https://sn8gmljs-8082.usw3.devtunnels.ms/api/v1/auth/login';
  private LOGIN_URL = `${environment.apiUrl}${environment.auth.loginUrl}`;
  private tokenKey = 'authToken';

  // private REFRESH_URL = 'http://localhost:8082/api/v1/auth/refresh';
  private REFRESH_URL = `${environment.apiUrl}${environment.auth.refreshUrl}`;
  private refreshTokenKey = 'refreshToken';

  private USERGET = `${environment.apiUrl}${environment.users.usersUrl}`;

  constructor(private httpClient: HttpClient, private router: Router, private encryptService: EncryptService) { }

  login(username: string, password: string): Observable<any>{
    return this.httpClient.post<any>(this.LOGIN_URL, {username, password}).pipe(
      tap(response => {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        if(response.token){
          this.setToken(response.token);
          this.setRefreshToken(response.refreshToken)
          this.autoRefreshToken();
        }
      })
    )
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

 
  private getToken(): string | null {
    if(typeof window !== 'undefined'){
      return localStorage.getItem(this.tokenKey);
    }else {
      return null;
    }
  }


  private setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  } 

  private getRefreshToken(): string | null {
    if(typeof window !== 'undefined'){
      return localStorage.getItem(this.refreshTokenKey);
    }else {
      return null;
    }
  }

  public async getUserName(): Promise<{ name: string | null; colaborador: string | null } | null> {
    const token = this.getToken();
    const datos: { 
      name: string | null; 
      colaborador: string | null;
      correo: string | null;
      rol: string |null;
      } = 
      { 
        name: null, 
        colaborador: null,
        correo: null,
        rol: null
      };
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        environment.users.id = payload.id;
        const response = await this.httpClient.get<any>(`${this.USERGET}${environment.users.id}`).toPromise();
        
        datos.name = response.resultado?.nombreCompleto || null;
        datos.colaborador = response.resultado?.colaboradorId || null;
        datos.correo = response.resultado?.username || null;
        datos.rol = response.resultado?.roles|| null;
        environment.bussines.id = response.resultado?.empresaId || null;
        return datos; 
      } catch (error) {
        console.error('Error al obtener el nombre del usuario', error);
        return null;
      }
    }
    return null;
  }
  



  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token available');
      return throwError(() => new Error('No refresh token available'));
    }
  
    return this.httpClient.post<any>(this.REFRESH_URL, { refreshToken }).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.setRefreshToken(response.refreshToken);
          this.autoRefreshToken();  // Reconfigura el auto-refresh después de obtener un nuevo token
        }
      }),
      catchError(error => {
        console.error('Error refreshing token', error);
        return throwError(() => new Error('Failed to refresh token'));
      })
    );
  }
  
  autoRefreshToken(): void {
    const token = this.getToken();
    if (!token) return;
  
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;  // Convertir a milisegundos
    const timeout = exp - Date.now() - (60 * 1000);  // 60 segundos antes de la expiración
  
    if (timeout > 0) {
      setTimeout(() => {
        this.refreshToken().subscribe({
          next: () => console.log('Token refreshed successfully'),
          error: (err) => {
            console.error('Failed to refresh token', err);
            this.logout(); // Cierra la sesión si no puede refrescar
          },
        });
      }, timeout);
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if(!token){
      return false;
    }
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() < exp;
  }

  logout(): void{
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.router.navigate(['/login']);
  }

  public getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = this.encryptService.descifrarAes(payload.role);
        return role;
      } catch (error) {
        console.error('Invalid token format', error);
        return null;
      }
    }
    return null;
  }

  // Este método ya está definido en tu código
public getTokenForInterceptor(): string | null {
  return this.getToken();
}

  public isAuthenticatedWithToken(): { isAuthenticated: boolean, token: string | null } {
    const token = this.getToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return { isAuthenticated: Date.now() < exp, token };
    }
    return { isAuthenticated: false, token: null };
  }
}
