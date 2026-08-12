using Ecommerce.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context) => _context = context;

    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = new DashboardStatsDto
        {
            TotalProducts = await _context.Products.CountAsync(),
            TotalOrders = await _context.Orders.CountAsync(),
            TotalUsers = await _context.Users.CountAsync(),
            TotalReviews = await _context.Reviews.CountAsync(),

            TotalRevenue = await _context.Orders
                .Where(o => o.Status != "Cancelled")
                .SumAsync(o => (decimal?)o.FinalAmount) ?? 0,

            PendingOrders = await _context.Orders.CountAsync(o => o.Status == "Pending"),
            LowStockProducts = await _context.Products.CountAsync(p => p.Stock <= 5 && p.IsActive),
            PendingReviewsCount = await _context.Reviews.CountAsync(r => !r.IsApproved),

            AverageRating = await _context.Reviews.AnyAsync()
                ? await _context.Reviews.AverageAsync(r => r.Rating)
                : 0,

            RecentOrders = await _context.Orders
                .OrderByDescending(o => o.CreatedDate)
                .Take(10)
                .Select(o => new RecentOrderDto
                {
                    Id = o.OrderID,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.User.FirstName + " " + o.User.LastName,
                    TotalAmount = o.FinalAmount,
                    Status = o.Status,
                    CreatedAt = o.CreatedDate
                }).ToListAsync(),

            RecentReviews = await _context.Reviews
                .OrderByDescending(r => r.CreatedDate)
                .Take(10)
                .Select(r => new RecentReviewDto
                {
                    Id = r.ReviewID,
                    ProductName = r.Product.ProductName,
                    UserName = r.User.FirstName + " " + r.User.LastName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    IsApproved = r.IsApproved,
                    CreatedAt = r.CreatedDate
                }).ToListAsync(),

            TopSellingProducts = await _context.OrderItems
                .GroupBy(oi => new { oi.ProductID, oi.Product.ProductName })
                .Select(g => new TopProductDto
                {
                    ProductId = g.Key.ProductID,
                    Name = g.Key.ProductName,
                    TotalSold = g.Sum(x => x.Quantity),
                    TotalRevenue = g.Sum(x => x.TotalPrice)
                })
                .OrderByDescending(p => p.TotalSold)
                .Take(5)
                .ToListAsync(),

            SalesByCategory = await _context.OrderItems
                .GroupBy(oi => oi.Product.Category.CategoryName)
                .Select(g => new CategorySalesDto
                {
                    CategoryName = g.Key,
                    TotalSales = g.Sum(x => x.TotalPrice),
                    OrderCount = g.Select(x => x.OrderID).Distinct().Count()
                })
                .OrderByDescending(c => c.TotalSales)
                .ToListAsync(),

            MonthlyRevenue = await _context.Orders
                .Where(o => o.CreatedDate >= DateTime.UtcNow.AddMonths(-6) && o.Status != "Cancelled")
                .GroupBy(o => new { o.CreatedDate.Year, o.CreatedDate.Month })
                .Select(g => new MonthlySalesDto
                {
                    Month = g.Key.Month + "/" + g.Key.Year,
                    Revenue = g.Sum(x => x.FinalAmount)
                })
                .OrderBy(x => x.Month)
                .ToListAsync()
        };

        return Ok(stats);
    }
}