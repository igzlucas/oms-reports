import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  signOut,
  User,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  getIdTokenResult,
  sendPasswordResetEmail
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  public user$: Observable<User | null> = new Observable();

  constructor(private router: Router) {
    this.user$ = new Observable(observer => {
      const unsubscribe = onAuthStateChanged(this.auth, observer);
      return unsubscribe;
    });
  }

  loginWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap((userCredential: UserCredential) => {
        return this.checkAndCreateUser(userCredential.user);
      }),
      catchError((error) => {
        console.error('Login failed:', error);
        throw error;
      })
    );
  }

  loginWithEmail(email: string, password: string):Observable<any>{
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      tap(() => this.router.navigate(['/login']))
    );
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map(user => user !== null));
  }

  getCurrentUserToken(): Observable<any> {
    return this.user$.pipe(
      switchMap(user => {
        if (user) {
          return from(getIdTokenResult(user));
        }
        return of(null);
      })
    );
  }

  forgotPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  private checkAndCreateUser(user: User): Observable<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    return from(getDoc(userRef)).pipe(
      switchMap((docSnap) => {
        if (!docSnap.exists()) {
          // User does not exist, create a new document
          return from(
            setDoc(userRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: new Date(),
              role: 'user' // Default role
            })
          );
        } else {
          // User already exists
          return of(undefined);
        }
      })
    );
  }
}
