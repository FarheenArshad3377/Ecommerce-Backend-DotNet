import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface AdminUser {
  userID: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  createdDate: string;
  orderCount: number;
}

interface UsersResponse {
  data: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);

  users: AdminUser[] = [];
  loading = true;
  error = false;

  page = 1;
  pageSize = 20;
  total = 0;

  // Backend has no role query param — filtered client-side over the current page.
  roleFilter: string | null = null;
  searchTerm = '';
  private searchDebounce: any;

  togglingId: number | null = null;
  toggleErrorId: number | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = false;

    let params = new HttpParams()
      .set('page', this.page)
      .set('pageSize', this.pageSize);

    if (this.searchTerm.trim()) params = params.set('search', this.searchTerm.trim());

    this.http.get<UsersResponse>(`${environment.apiUrl}/api/users/admin/all`, { params }).subscribe({
      next: (res) => {
        this.users = res.data;
        this.total = res.total;
        this.page = res.page;
        this.pageSize = res.pageSize;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  get filteredUsers(): AdminUser[] {
    if (!this.roleFilter) return this.users;
    return this.users.filter(u => u.role === this.roleFilter);
  }

  onSearchChange(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page = 1;
      this.loadUsers();
    }, 350);
  }

  filterByRole(role: string | null): void {
    this.roleFilter = role;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadUsers();
    }
  }

  toggleStatus(user: AdminUser): void {
    if (user.role === 'Admin') return; // backend rejects this — button is disabled too

    this.togglingId = user.userID;
    this.toggleErrorId = null;

    this.http.put(`${environment.apiUrl}/api/users/admin/${user.userID}/toggle-status`, {}).subscribe({
      next: () => {
        user.isActive = !user.isActive;
        this.togglingId = null;
      },
      error: (err) => {
        console.error('Error toggling user status:', err);
        this.togglingId = null;
        this.toggleErrorId = user.userID;
        setTimeout(() => { this.toggleErrorId = null; }, 2500);
      }
    });
  }

  trackByUserId(index: number, user: AdminUser): number {
    return user.userID;
  }
}