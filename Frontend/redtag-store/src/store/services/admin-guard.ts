import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export const adminGuard = () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  // Sirf tabhi localStorage check karo agar hum BROWSER par hain
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token && role === 'Admin') {
      return true;
    }
  }

  // Agar server par ho ya admin na ho, to login par bhej do
  // Note: Server-side redirect ke liye safe checks zaroori hain, ya simply return false karein
  if (isPlatformBrowser(platformId)) {
    router.navigate(['/login']);
  }
  return false;
};