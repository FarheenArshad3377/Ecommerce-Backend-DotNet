import { Routes } from '@angular/router';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // ===== Default redirect =====
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ===== Auth =====
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },

  // ===== Core pages =====
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./pages/accounts/account.component').then(m => m.AccountComponent)
  },

  // ===== Shopping =====
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./pages/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/shop/shop.component').then(m => m.ShopComponent)
    // 👆 "Shop" nav link aur home page ke "View All"/"Explore" links /products point karte hain.
    // Agar aapka listing page ShopComponent hi hai to ye theek hai, warna alag ProductsComponent banayein.
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./pages/productDetail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'category/:slug',
    loadComponent: () =>
      import('./pages/category-products/category-products.component').then(m => m.CategoryProductsComponent)
  },
{
  path: 'search',
  loadComponent: () =>
    import('./pages/search-results/search-results.component').then(m => m.SearchResultsComponent)
},
{ path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  // ===== Placeholder routes referenced in templates (create these when ready) =====
  // { path: 'sale', loadComponent: () => import('./pages/sale/sale.component').then(m => m.SaleComponent) },
  // { path: 'new-arrivals', loadComponent: () => import('./pages/new-arrivals/new-arrivals.component').then(m => m.NewArrivalsComponent) },
  // { path: 'categories', loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'orders', loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent) },

  // ===== Wildcard — kisi bhi unknown route ko home pe bhej dein =====
  { path: '**', redirectTo: 'home' }
];