import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { ChatWidgetComponent } from '../../chatbot-widget/chat-widget.component';
import { ProductService } from '../../../store/services/product.service';
import { ProductListDto } from '../../../store/services/product.model';
import { CartService } from '../../../store/services/cart.service';
import { ToastService } from '../../../store/services/toast.service';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn } from '../../../store/auth/auth.selectors';
import { AuthActions } from '../../../store/auth/auth.actions';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { CATEGORY_SLUG_MAP } from '../../../store/services/category-slug-map';
import { Router } from '@angular/router';
  import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ChatStateService } from '../../../store/services/chat-state.service';
interface Category {
  name: string;
  slug: string;
  icon: string;
}

interface CategorySection {
  name: string;
  slug: string;
  columns?: number;  
  products: ProductListDto[];
}

interface HeroSlide {
  title: string;
  subtitle: string;
  ctaLink: string;
  imageUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChatWidgetComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private store = inject(Store);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  cartCount = signal(0);
  newsletterEmail = '';

  products = signal<ProductListDto[]>([]);
  loading = signal(true);
  error = signal('');

  // Amazon-style category sections (multiple categories ka data ek saath)
  categorySections = signal<CategorySection[]>([]);
  sectionsLoading = signal(true);

  // Hero carousel
  heroSlides = signal<HeroSlide[]>([]);
  activeSlide = signal(0);
  private carouselTimer?: ReturnType<typeof setInterval>;

  @ViewChild('scrollRow') scrollRow?: ElementRef<HTMLDivElement>;
 @ViewChild('trendingRow') trendingRow?: ElementRef<HTMLDivElement>;   // 👈 naya
 recentlyViewed = signal<ProductListDto[]>([]);
recentlyViewedLoading = signal(true);
@ViewChild('recentlyViewedRow') recentlyViewedRow?: ElementRef<HTMLDivElement>;
private searchSubject = new Subject<string>();

 trendingMixed = signal<ProductListDto[]>([]);
  isLoggedIn = toSignal(this.store.select(selectIsLoggedIn), { initialValue: false });

  categories: Category[] = [
    { name: 'Electronics', slug: 'electronics', icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 20h6M11 14v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>` },
    { name: 'Fashion', slug: 'fashion', icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 4l4 3 4-3 4 4-3 3v10H7V11L4 8l4-4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>` },
    { name: 'Home', slug: 'home', icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5H9v5a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>` },
    { name: 'Books', slug: 'books', icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 012-2h10a2 2 0 012 2v15l-7-3-7 3V5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>` },
  ];

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategorySections();
    this.setupSearch();
    // Dynamic subscription jo login status change hone par chalega
 this.store.select(selectIsLoggedIn).subscribe(loggedIn => {
    console.log('1. Auth State Changed. IsLoggedIn:', loggedIn); // 👈 Debug log
    if (loggedIn) {
      this.loadRecentlyViewed();
    }
  });
  }
private loadRecentlyViewed(): void {
  this.recentlyViewedLoading.set(true);
  this.productService.getRecentlyViewed().subscribe({
    next: (data) => {
      console.log('3. Backend Data Received:', data);
      
      // MOCK DATA FOR TESTING ONLY: Agar data khali aaye to fake data dal do
      

      this.recentlyViewed.set(data);
      this.recentlyViewedLoading.set(false);
    },
    error: (err) => {
      this.recentlyViewedLoading.set(false);
    }
  });
}

recentlyViewedScrollLeft(): void {
  this.recentlyViewedRow?.nativeElement.scrollBy({ left: -320, behavior: 'smooth' });
}

recentlyViewedScrollRight(): void {
  this.recentlyViewedRow?.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
}
  ngOnDestroy(): void {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
private router = inject(Router);   // top imports mein Router import karna hoga: import { Router } from '@angular/router';

onAccountIconClick(event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  if (this.isLoggedIn()) {
    this.router.navigate(['/account']);   // logged in ho to profile/account page
  } else {
    this.router.navigate(['/login']);     // warna login page
  }
}
  private loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data.slice(0, 8));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Products load failed:', err);
        this.error.set('Products load nahi ho sake. Backend check karein.');
        this.loading.set(false);
      }
    });
  }
showLogoutConfirm = signal(false);

// purana logout() method replace karein:
requestLogout(): void {
  this.showLogoutConfirm.set(true);
}

confirmLogout(): void {
  this.store.dispatch(AuthActions.logout());
 if (typeof window !== 'undefined') {
    localStorage.removeItem('redtag_chat_history');
  }

  this.showLogoutConfirm.set(false);
}

cancelLogout(): void {
  this.showLogoutConfirm.set(false);
}
  // Multiple categories ka data ek saath fetch — Amazon jaisi grid sections banane ke liye
private loadCategorySections(): void {
  this.sectionsLoading.set(true);

  const validCategories = this.categories
    .map(cat => ({ cat, categoryId: CATEGORY_SLUG_MAP[cat.slug] }))
    .filter((entry): entry is { cat: Category; categoryId: number } =>
      entry.categoryId !== null && entry.categoryId !== undefined
    );

  if (validCategories.length === 0) {
    this.sectionsLoading.set(false);
    return;
  }

  const requests = validCategories.map(({ cat, categoryId }) => {
    const isElectronics = cat.slug === 'electronics';
    const limit = isElectronics ? 8 : 4;        // electronics ke liye zyada items
    const columns = isElectronics ? 4 : 2;      // 👈 electronics ko 2 extra columns

    return this.productService.getProductsByCategory(categoryId).pipe(
      map(res => ({
        name: cat.name,
        slug: cat.slug,
        products: (res?.data ?? []).slice(0, limit),
        columns
      } as CategorySection))
    );
  });

  forkJoin(requests).subscribe({
    next: (sections) => {
      const valid = sections.filter(s => s.products.length > 0);
      this.categorySections.set(valid);
      this.buildHeroSlides(valid);

      // Trending: har category se 2-2 products mix kar ke single flat array
      const mixed: ProductListDto[] = [];
      valid.forEach(s => mixed.push(...s.products.slice(0, 2)));
      this.trendingMixed.set(mixed);

      this.sectionsLoading.set(false);
    },
    error: (err) => {
      console.error('Category sections load failed:', err);
      this.sectionsLoading.set(false);
    }
  });
}
  private buildHeroSlides(sections: CategorySection[]): void {
    const slides: HeroSlide[] = sections
      .filter(s => s.products.length > 0)
      .map(s => ({
        title: s.name,
        subtitle: `Discover our ${s.name} collection — curated for you`,
        ctaLink: `/category/${s.slug}`,
        imageUrl: this.getImageUrl(s.products[0].imageUrl)
      }));
    this.heroSlides.set(slides);
    this.startCarousel();
  }

  private startCarousel(): void {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
    if (this.heroSlides().length <= 1) return;
    this.carouselTimer = setInterval(() => this.nextSlide(), 5000);
  }

  nextSlide(): void {
    const len = this.heroSlides().length;
    if (!len) return;
    this.activeSlide.update(i => (i + 1) % len);
    this.startCarousel(); // manual click pe timer reset
  }

  prevSlide(): void {
    const len = this.heroSlides().length;
    if (!len) return;
    this.activeSlide.update(i => (i - 1 + len) % len);
    this.startCarousel();
  }

  goToSlide(i: number): void {
    this.activeSlide.set(i);
    this.startCarousel();
  }

scrollLeft(): void {
  this.scrollRow?.nativeElement.scrollBy({ left: -320, behavior: 'smooth' });
}

scrollRight(): void {
  this.scrollRow?.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
}

trendingScrollLeft(): void {
  this.trendingRow?.nativeElement.scrollBy({ left: -320, behavior: 'smooth' });
}

trendingScrollRight(): void {
  this.trendingRow?.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
}

  addToCart(product: ProductListDto) {
    this.cartService.addToCart(product.productID, 1).subscribe({
      next: () => {
        this.toastService.show(`${product.productName} cart mein add ho gaya!`, 'success');
      },
      error: (err) => {
        console.error('Add to cart failed:', err);
        this.toastService.show('Add to cart nahi ho saka.', 'error');
      }
    });
  }

  hasDiscount(product: ProductListDto): boolean {
    return !!product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  }

  discountPercent(product: ProductListDto): number {
    if (!this.hasDiscount(product) || !product.discountPrice) return 0;
    return Math.round(((product.price - product.discountPrice) / product.price) * 100);
  }

  subscribe() {
    if (!this.newsletterEmail) return;
    console.log('Subscribed:', this.newsletterEmail);
    this.newsletterEmail = '';
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


// Class ke andar naye signals/state
searchQuery = signal('');
searchSuggestions = signal<ProductListDto[]>([]);
showSuggestions = signal(false);
searchLoading = signal(false);

// ngOnInit mein ye add karein (existing loadProducts()/loadCategorySections() ke sath)
private setupSearch(): void {
  this.searchSubject.pipe(
    debounceTime(300),          // 300ms rukein taake har keystroke pe call na ho
    distinctUntilChanged(),      // same query dobara na bheje
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
  if (this.searchQuery().trim().length >= 2) {
    this.showSuggestions.set(true);
  }
}

onSearchBlur(): void {
  // Thora delay taake click event pehle fire ho jaye, warna dropdown close ho ke click miss ho jata hai
  setTimeout(() => this.showSuggestions.set(false), 150);
}

goToSuggestion(product: any): void {
  // Backend autocomplete se 'id' aata hai aur product-grid se 'productID'
  const targetId = product.id || product.productID || product.productId;

  if (targetId) {
    // Navigate strictly to the detail page route
    this.router.navigate(['/product', targetId]);
  } else {
    console.error('Routing failed: Product ID missing from object structure', product);
  }
}

onSearchSubmit(): void {
  const q = this.searchQuery().trim();
  if (!q) return;
  this.showSuggestions.set(false);
  this.router.navigate(['/search'], { queryParams: { q } });
}
}