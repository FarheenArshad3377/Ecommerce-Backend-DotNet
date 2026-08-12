import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthResponse, RegisterPayload, LoginPayload } from './auth.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Register': props<{ payload: RegisterPayload }>(),
    'Register Success': props<{ response: AuthResponse }>(),
    'Register Failure': props<{ error: string }>(),

    'Login': props<{ payload: LoginPayload }>(),
    'Login Success': props<{ response: AuthResponse }>(),
    'Login Failure': props<{ error: string }>(),

    'Logout': emptyProps(),
    'Clear Error': emptyProps()
  }
});