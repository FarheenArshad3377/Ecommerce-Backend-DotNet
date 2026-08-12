export interface RecentOrderDto {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface RecentReviewDto {
  id: number;
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface TopProductDto {
  productId: number;
  name: string;
  totalSold: number;
  totalRevenue: number;
}

export interface CategorySalesDto {
  categoryName: string;
  totalSales: number;
  orderCount: number;
}

export interface MonthlySalesDto {
  month: string;
  revenue: number;
}

export interface DashboardStatsDto {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalReviews: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  averageRating: number;
  pendingReviewsCount: number;
  recentOrders: RecentOrderDto[];
  recentReviews: RecentReviewDto[];
  topSellingProducts: TopProductDto[];
  salesByCategory: CategorySalesDto[];
  monthlyRevenue: MonthlySalesDto[];
}

// Products admin listing ke liye (alag feature - products page)
export interface ProductAdminDto {
  productID: number;
  productName: string;
  sku: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  category: string;
}