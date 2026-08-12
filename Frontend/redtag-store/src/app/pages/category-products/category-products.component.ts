import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../../store/services/product.service';
import { ProductListDto } from '../../../store/services/product.model';
import { CartService } from '../../../store/services/cart.service';
import { ToastService } from '../../../store/services/toast.service';
import { CATEGORY_SLUG_MAP } from '../../../store/services/category-slug-map';
import { environment } from '../../../environments/environment';
import { AppFooterComponent } from "../../../components/footer/app-footer.component";
import { AppHeaderComponent } from "../../../components/header/app-header.component";

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, RouterLink, AppFooterComponent, AppHeaderComponent],
  templateUrl: './category-products.component.html',
  styleUrl: './category-products.component.scss'
})
export class CategoryProductsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  products = signal<ProductListDto[]>([]);
  loading = signal(true);
  error = signal('');
  categorySlug = signal('');
  notAvailable = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      this.categorySlug.set(slug);
      this.loadCategory(slug);
    });
  }

  private loadCategory(slug: string): void {
    const categoryId = CATEGORY_SLUG_MAP[slug];

    if (categoryId === undefined || categoryId === null) {
      this.notAvailable.set(true);
      this.loading.set(false);
      return;
    }

    this.notAvailable.set(false);
    this.loading.set(true);
    this.productService.getProductsByCategory(categoryId).subscribe({
      next: (response: { data: ProductListDto[]; total: number; page: number; pageSize: number; totalPages: number }) => {
        this.products.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Products load nahi ho sake.');
        this.loading.set(false);
      }
    });
  }
// category-products.component.ts me add karo
getImageUrl(path?: string | null): string {
  if (!path) return 'assets/no-image.png';
  return `${environment.apiUrl}${path}`;
}
  hasDiscount(product: ProductListDto): boolean {
    return !!product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  }

  displayPrice(product: ProductListDto): string {
    const price = this.hasDiscount(product) && product.discountPrice !== null
      ? product.discountPrice
      : product.price;
    return price.toFixed(2);
  }

  addToCart(product: ProductListDto): void {
    this.cartService.addToCart(product.productID, 1).subscribe({
      next: () => this.toastService.show(`${product.productName} cart mein add ho gaya!`, 'success'),
      error: () => this.toastService.show('Add to cart nahi ho saka.', 'error')
    });
  }
}