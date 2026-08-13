import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthActions } from './auth.actions';
import { AuthService } from './auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ payload }) =>
        this.authService.register(payload).pipe(
          map((response) => AuthActions.registerSuccess({ response })),
          catchError((err) =>
            of(AuthActions.registerFailure({ error: err.error?.message || 'Registration failed' }))
          )
        )
      )
    )
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ payload }) =>
        this.authService.login(payload).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((err) =>
            of(AuthActions.loginFailure({ error: err.error?.message || 'Invalid email or password' }))
          )
        )
      )
    )
  );

authSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess, AuthActions.loginSuccess),
        tap(({ response }) => {
          // 💾 Safe key synchronization inside storage
          localStorage.setItem('token', response.token);

          console.log('🔍 Full response object:', response);

          let userRole = response.role;
          console.log('🔍 Role from response.role:', userRole);

          // 🛡️ Token Claims Extract Engine
          if (!userRole && response.token) {
            try {
              const decoded: any = jwtDecode(response.token);
              console.log('🔍 Full decoded token claims:', decoded);
              
              userRole = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
              console.log('🔍 Role extracted from token claims:', userRole);
            } catch (e) {
              console.error('Token metadata extraction failed:', e);
            }
          }

          console.log('🔍 Final userRole target determined:', userRole);

          // 🎯 Sab users (admin ho ya customer) ab home pe jayenge.
          //    Admin wahan se floating pill button se dashboard tak pahunch sakta hai.
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );
}