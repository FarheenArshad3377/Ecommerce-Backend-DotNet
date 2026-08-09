import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../store/services/product.service';
import { ProductListDto } from '../../../store/services/product.model';
import { CartService } from '../../../store/services/cart.service';
import { ToastService } from '../../../store/services/toast.service';
import { environment } from '../../../environments/environment';
import { CATEGORY_SLUG_MAP } from '../../../store/services/category-slug-map';

type SortOption = 'price_asc' | 'price_desc' | 'rating' | 'newest';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  query = signal('');
  products = signal<ProductListDto[]>([]);
  totalResults = signal(0);
  loading = signal(true);
  error = signal('');

  // Filters
  selectedCategory = signal<number | null>(null);
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  minRating = signal<number | null>(null);
  inStockOnly = signal(false);
  sortBy = signal<SortOption>('newest');

  categoryOptions = Object.entries(CATEGORY_SLUG_MAP)
    .filter(([, id]) => id !== null)
    .map(([slug, id]) => ({ slug, id: id as number, label: slug.charAt(0).toUpperCase() + slug.slice(1) }));

  ratingOptions = [4, 3, 2, 1];

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedCategory() !== null) count++;
    if (this.minPrice() !== null || this.maxPrice() !== null) count++;
    if (this.minRating() !== null) count++;
    if (this.inStockOnly()) count++;
    return count;
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q') ?? '';
      this.query.set(q);
      this.runSearch();
    });
  }

  runSearch(): void {
    this.loading.set(true);
    this.error.set('');

    this.productService.getFilteredProducts({
      search: this.query() || undefined,
      categoryId: this.selectedCategory() ?? undefined,
      minPrice: this.minPrice() ?? undefined,
      maxPrice: this.maxPrice() ?? undefined,
      minRating: this.minRating() ?? undefined,
      inStockOnly: this.inStockOnly() || undefined,
      sortBy: this.sortBy(),
      page: 1,
      pageSize: 24
    }).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.totalResults.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.error.set('Search results load nahi ho sake.');
        this.loading.set(false);
      }
    });
  }

  onCategoryChange(categoryId: number | null): void {
    this.selectedCategory.set(categoryId);
    this.runSearch();
  }

  onPriceApply(): void {
    this.runSearch();
  }

  onRatingChange(rating: number | null): void {
    this.minRating.set(rating);
    this.runSearch();
  }

  onStockToggle(): void {
    this.inStockOnly.update(v => !v);
    this.runSearch();
  }

  onSortChange(sort: SortOption): void {
    this.sortBy.set(sort);
    this.runSearch();
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.minRating.set(null);
    this.inStockOnly.set(false);
    this.sortBy.set('newest');
    this.runSearch();
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

  getImageUrl(path?: string | null): string {
    if (!path) return 'assets/no-image.png';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }

  addToCart(product: ProductListDto): void {
    this.cartService.addToCart(product.productID, 1).subscribe({
      next: () => this.toastService.show(`${product.productName} cart mein add ho gaya!`, 'success'),
      error: () => this.toastService.show('Add to cart nahi ho saka.', 'error')
    });
  }
}