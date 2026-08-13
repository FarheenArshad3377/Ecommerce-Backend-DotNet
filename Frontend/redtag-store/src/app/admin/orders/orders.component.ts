import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AdminOrder {
  orderID: number;
  orderNumber: string;
  status: string;
  finalAmount: number;
  createdDate: string;
  customer: string;
  email: string;
  paymentStatus: string;
}

interface OrdersResponse {
  data: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  private http = inject(HttpClient);

  orders: AdminOrder[] = [];
  loading = true;
  error = false;

  page = 1;
  pageSize = 20;
  total = 0;

  statusFilter: string | null = null;
  statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = false;

    let params = new HttpParams()
      .set('page', this.page)
      .set('pageSize', this.pageSize);

    if (this.statusFilter) {
      params = params.set('status', this.statusFilter);
    }

    this.http.get<OrdersResponse>(`${environment.apiUrl}/api/orders/admin/all`, { params }).subscribe({
      next: (res) => {
        this.orders = res.data;
        this.total = res.total;
        this.page = res.page;
        this.pageSize = res.pageSize;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  filterByStatus(status: string | null): void {
    this.statusFilter = status;
    this.page = 1;
    this.loadOrders();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadOrders();
    }
  }

  statusClass(status: string): string {
    return 'status-' + status.toLowerCase();
  }

  trackByOrderId(index: number, order: AdminOrder): number {
    return order.orderID;
  }

  viewDetails(order: AdminOrder): void {
    // TODO: route to order detail page, e.g.:
    // this.router.navigate(['/admin/orders', order.orderID]);
    console.log('View order', order.orderID);
  }
}