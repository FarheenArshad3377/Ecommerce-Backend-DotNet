import { Routes } from '@angular/router';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './guards/admin-guard'; // Guard ka path exact match rakhein
import { DashboardComponent } from './admin/dashboard/dashboard.component';

// Admin Pages Imports
import { ProductsComponent } from './admin/products/products.component';
import { OrdersComponent } from './admin/orders/orders.component';
import { ReviewsComponent } from './admin/reviews/reviews.component';
import { UsersComponent } from './admin/users/users.component';
import { SettingsComponent } from './admin/settings/settings.component';
// import { ReviewsComponent } from './admin/reviews/reviews.component';
// import { UsersComponent } from './admin/users/users.component';
// import { SettingsComponent } from './admin/settings/settings.component';

export const routes: Routes = [

  // ===== Default redirect =====
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ===== Auth =====
  {
    path: 'signup',
    loadComponent: () => import('./pages/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },

  // ===== Core pages =====
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/accounts/account.component').then(m => m.AccountComponent)
  },

  // ==========================================
  // 🔐 ADMIN SECURE PANEL (Nested & Protected)
  // ==========================================
  { 
    path: 'admin', 
    canActivate: [adminGuard], // 👈 Pure group ko sirf admin hi open kar payega
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'reviews', component: ReviewsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' } // /admin pe aaye to dashboard pe bhej de
    ]
  },

  // ===== Shopping (Customer Side Pages) =====
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/productDetail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'category/:slug',
    loadComponent: () => import('./pages/category-products/category-products.component').then(m => m.CategoryProductsComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search-results/search-results.component').then(m => m.SearchResultsComponent)
  },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'orders', loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent) },

  // ===== Wildcard — kisi bhi unknown route ko home pe bhej dein =====
  { path: '**', redirectTo: 'home' }
];