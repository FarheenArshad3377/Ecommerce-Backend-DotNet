import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DashboardService } from '../../../store/services/dashboard.service';
import { DashboardStatsDto } from '../../../store/services/dashboard.model';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

navItems: NavItem[] = [
  { label: 'Overview', route: '/admin/dashboard', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>` },
  { label: 'Products', route: '/admin/products', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 8l-9-5-9 5 9 5 9-5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 8v8l9 5 9-5V8" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>` },
  { label: 'Orders', route: '/admin/orders', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 8h14l-1.5 12h-11L5 8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 8V6a4 4 0 018 0v2" stroke="currentColor" stroke-width="1.8"/></svg>` },
  { label: 'Users', route: '/admin/users', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" stroke-width="1.8"/></svg>` },
];

  stats: DashboardStatsDto | null = null;
  loading = true;
  error = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

loadStats(): void {
    this.loading = true;
    this.error = '';
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        // 👇 Yeh log humein poora data browser console mein dikhaye ga
        console.log('🔴 LIVE DATABASE DATA:', data);
        
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.error = 'Dashboard data load nahi ho saka. Dobara try karein.';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    return 'status-' + status.toLowerCase();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  }
}