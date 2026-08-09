import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface Stat {
  label: string;
  value: number;
  icon: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Pending' | 'Delivered' | 'Cancelled';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'assets/avatars/john-doe.jpg'
  };

  navItems: NavItem[] = [
    { label: 'Overview', route: '/dashboard', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>` },
    { label: 'Orders', route: '/dashboard/orders', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 8h14l-1.5 12h-11L5 8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 8V6a4 4 0 018 0v2" stroke="currentColor" stroke-width="1.8"/></svg>` },
    { label: 'Addresses', route: '/dashboard/addresses', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.6 7-11.5A7 7 0 105 9.5C5 14.4 12 21 12 21z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.8"/></svg>` },
    { label: 'Reviews', route: '/dashboard/reviews', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8L12 3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>` },
    { label: 'Settings', route: '/dashboard/settings', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z" stroke="currentColor" stroke-width="1.6"/></svg>` },
  ];

  stats: Stat[] = [
    { label: 'Total Orders', value: 42, icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1.4" fill="currentColor"/><circle cx="18" cy="21" r="1.4" fill="currentColor"/><path d="M2 3h2l2.4 12.4a2 2 0 002 1.6h8.2a2 2 0 002-1.6L21 7H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
    { label: 'Wishlist', value: 18, icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>` },
    { label: 'Reviews', value: 7, icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8L12 3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>` },
  ];

  recentOrders: Order[] = [
    { id: '#RT-8492', date: 'Oct 24, 2023', total: 245.00, status: 'Pending' },
    { id: '#RT-8485', date: 'Oct 18, 2023', total: 1299.00, status: 'Delivered' },
    { id: '#RT-8470', date: 'Oct 12, 2023', total: 89.50, status: 'Cancelled' },
  ];

  toggleActionMenu(orderId: string) {
    // apna dropdown/action-menu logic yahan lagao
    console.log('Toggle actions for', orderId);
  }

  logout() {
    // apna auth service ka logout call yahan karo
    console.log('Logging out...');
  }
}