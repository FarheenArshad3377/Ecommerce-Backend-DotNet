import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CheckoutService } from '../../../store/services/checkout.service';
import { ToastService } from '../../../store/services/toast.service';
import { OrderListItem } from '../../../store/services/order.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  private checkoutService = inject(CheckoutService);
  private toastService = inject(ToastService);

  orders = signal<OrderListItem[]>([]);
  loading = signal(true);
  cancellingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.checkoutService.getMyOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Orders load nahi ho sakin.', 'error');
        this.loading.set(false);
      }
    });
  }

  canCancel(status: string): boolean {
    return status === 'Pending' || status === 'Confirmed';
  }

  cancelOrder(orderId: number): void {
    this.cancellingId.set(orderId);
    this.checkoutService.cancelOrder(orderId).subscribe({
      next: () => {
        this.toastService.show('Order cancel ho gayi.', 'success');
        this.loadOrders();
        this.cancellingId.set(null);
      },
      error: (err) => {
        this.toastService.show(err?.error?.message || 'Cancel nahi ho saka.', 'error');
        this.cancellingId.set(null);
      }
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      Pending: 'status-pending',
      Confirmed: 'status-confirmed',
      Processing: 'status-processing',
      Shipped: 'status-shipped',
      Delivered: 'status-delivered',
      Cancelled: 'status-cancelled'
    };
    return map[status] || 'status-pending';
  }
}