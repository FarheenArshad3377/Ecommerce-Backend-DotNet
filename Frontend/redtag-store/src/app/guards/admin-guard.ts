import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      // Backend claims se dynamic role configuration extract kar rahe hain
      const role = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      if (role && role.toLowerCase() === 'admin') {
        return true; 
      }
    } catch (error) {
      console.error('Guard token translation failed:', error);
    }
  }

  router.navigate(['/home']);
  return false;
};