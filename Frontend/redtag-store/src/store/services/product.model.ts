export interface ProductImageDto {
  imageID: number;
  imageUrl: string;
  isMain: boolean;
}

export interface ReviewDto {
  reviewID: number;
  rating: number;
  comment: string;
  createdDate: string;
  userName: string;
}

// GET /api/products (list) ka structure
export interface ProductListDto {
  productID: number;
  productName: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  sku: string;
  imageUrl: string;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  category: string;
  images: string[];
}

// GET /api/products/{id} (single) ka structure
export interface ProductDetailDto {
  productID: number;
  productName: string;
  description: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  sku: string;
  imageUrl: string;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  createdDate: string;
  category: { categoryID: number; categoryName: string };
  images: ProductImageDto[];
  reviews: ReviewDto[];
}
export interface Product {
  productID: number;
  productName: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  imageUrl?: string;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  category: string;
  images: string[];
}

export interface PagedProducts {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilters {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  search?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}
export interface ApiResponse<T> {
  data: T;
}
export interface ProductAdminDto {
  productID: number;
  productName: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: string;
}