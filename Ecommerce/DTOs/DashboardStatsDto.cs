using System;
using System.Collections.Generic;

public class DashboardStatsDto
{
    public int TotalProducts { get; set; }
    public int TotalOrders { get; set; }
    public int TotalUsers { get; set; }
    public int TotalReviews { get; set; }
    public decimal TotalRevenue { get; set; }

    public int PendingOrders { get; set; }
    public int LowStockProducts { get; set; }
    public double AverageRating { get; set; }
    public int PendingReviewsCount { get; set; }

    public List<RecentOrderDto> RecentOrders { get; set; } = new();
    public List<RecentReviewDto> RecentReviews { get; set; } = new();
    public List<TopProductDto> TopSellingProducts { get; set; } = new();
    public List<CategorySalesDto> SalesByCategory { get; set; } = new();
    public List<MonthlySalesDto> MonthlyRevenue { get; set; } = new();
}

public class RecentOrderDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class RecentReviewDto
{
    public int Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }          // nullable, kyunke ReviewModel mein bhi Comment nullable hai
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TopProductDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TotalSold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class CategorySalesDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal TotalSales { get; set; }
    public int OrderCount { get; set; }
}

public class MonthlySalesDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
}