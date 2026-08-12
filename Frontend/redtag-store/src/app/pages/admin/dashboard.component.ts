import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../store/services/dashboard.service';
import { DashboardStatsDto } from '../../../store/services/dashboard.model';
import { ProductService } from '../../../store/services/product.service'; 
import { ProductAdminDto } from '../../../store/services/dashboard.model'; // Agar model path doosra hai to sahi check kar lein

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Services Injection (Class ke andar)
  private dashboardService = inject(DashboardService);
  private productService = inject(ProductService);

  // Signals Component States (Class ke andar)
  stats = signal<DashboardStatsDto | null>(null);
  adminProducts = signal<ProductAdminDto[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadDashboardProducts();
  }

  // 1. Backend Dashboard Stats Analytics Load Controller
  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard loading failed:', err);
        this.error.set('Dashboard data load nahi ho saka.');
        this.loading.set(false);
      }
    });
  }

  // 2. Dynamic Admin Products Table Loader
private loadDashboardProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        // Data ko map karke null ko undefined mein badlein
        const mappedProducts: ProductAdminDto[] = data.map(prod => ({
          ...prod,
          discountPrice: prod.discountPrice === null ? undefined : prod.discountPrice
        }));
        
        this.adminProducts.set(mappedProducts);
      },
      error: (err) => {
        console.error('Failed to load table products:', err);
      }
    });
  }
  // Action Click Handlers
  openAddProductModal(): void {
    console.log('Opening add product context modal panel...');
  }

  editProduct(product: ProductAdminDto): void {
    console.log('Editing chosen product entity metadata fields:', product);
  }

  deleteProduct(id: number): void {
    if (confirm('Kya aap waqai yeh product delete karna chahte hain?')) {
      console.log('Deleting target entity with ID key:', id);
    }
  }

  // Utility Price Formatter
  formatPrice(price: number | undefined): string {
    if (price === undefined) return '0.00';
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
} // <-- Class Yahan Close Hogi!