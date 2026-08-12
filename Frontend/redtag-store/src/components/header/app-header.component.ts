import { Component, inject, signal, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';
import { AuthActions } from '../../store/auth/auth.actions';
import { ProductService } from '../../store/services/product.service';
import { ProductListDto } from '../../store/services/product.model';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss'
})
export class AppHeaderComponent {
  private store = inject(Store);
  private router = inject(Router);
  private productService = inject(ProductService);

  @Input() cartCount = 0;

  isLoggedIn = toSignal(this.store.select(selectIsLoggedIn), { initialValue: false });

  searchQuery = signal('');
  searchSuggestions = signal<ProductListDto[]>([]);
  showSuggestions = signal(false);
  searchLoading = signal(false);
  showLogoutConfirm = signal(false);

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.searchSuggestions.set([]);
          this.searchLoading.set(false);
          return of([]);
        }
        this.searchLoading.set(true);
        return this.productService.searchProducts(query, 6).pipe(
          catchError(() => {
            this.searchLoading.set(false);
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      this.searchSuggestions.set(results);
      this.searchLoading.set(false);
    });
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.showSuggestions.set(true);
    this.searchSubject.next(value);
  }

  onSearchFocus(): void {
    if (this.searchQuery().trim().length >= 2) this.showSuggestions.set(true);
  }

  onSearchBlur(): void {
    setTimeout(() => this.showSuggestions.set(false), 150);
  }

  onSearchSubmit(): void {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.showSuggestions.set(false);
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  goToSuggestion(product: any): void {
    const targetId = product.id || product.productID || product.productId;
    if (targetId) this.router.navigate(['/product', targetId]);
  }

  getImageUrl(path?: string | null): string {
    if (!path) return 'assets/no-image.png';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }

  displayPrice(product: ProductListDto): string {
    const price = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
    return price.toFixed(2);
  }

  onAccountIconClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate([this.isLoggedIn() ? '/account' : '/login']);
  }

  requestLogout(): void {
    this.showLogoutConfirm.set(true);
  }

  confirmLogout(): void {
    this.store.dispatch(AuthActions.logout());
    if (typeof window !== 'undefined') localStorage.removeItem('redtag_chat_history');
    this.showLogoutConfirm.set(false);
  }

  cancelLogout(): void {
    this.showLogoutConfirm.set(false);
  }
}