using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Ecommerce.Data;
using Ecommerce.DTOs;
using Ecommerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RecentlyViewedController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecentlyViewedController(AppDbContext context)
        {
            _context = context;
        }

        // Helper: current logged-in user ki ID JWT se nikalna
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim);
        }

        // POST api/recentlyviewed/5
        // Jab bhi user kisi product ko open kare (home page ya detail page), ye call hogi
        [HttpPost("{productId}")]
        public async Task<IActionResult> RecordView(int productId)
        {
            var userId = GetCurrentUserId();

            var productExists = await _context.Products.AnyAsync(p => p.ProductID == productId);
            if (!productExists)
                return NotFound("Product not found.");

            var existing = await _context.RecentlyViewed
                .FirstOrDefaultAsync(x => x.UserID == userId && x.ProductID == productId);

            if (existing != null)
            {
                existing.ViewedAt = DateTime.UtcNow;
            }
            else
            {
                _context.RecentlyViewed.Add(new RecentlyViewedModel
                {
                    UserID = userId,
                    ProductID = productId,
                    ViewedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "View recorded." });
        }

        // GET api/recentlyviewed?excludeProductId=5&take=10
        // Home page aur product detail page dono isko use karengi
        [HttpGet]
        public async Task<IActionResult> GetRecentlyViewed([FromQuery] int? excludeProductId = null, [FromQuery] int take = 10)
        {
            var userId = GetCurrentUserId();

            var query = _context.RecentlyViewed
                .Where(x => x.UserID == userId);

            if (excludeProductId.HasValue)
                query = query.Where(x => x.ProductID != excludeProductId.Value);

            var result = await query
                .OrderByDescending(x => x.ViewedAt)
                .Take(take)
                .Include(x => x.Product)
                .Select(x => new RecentlyViewedDto
                {
                    ProductID = x.Product.ProductID,
                    ProductName = x.Product.ProductName,
                    Price = x.Product.Price,
                    DiscountPrice = x.Product.DiscountPrice,
                    ImageUrl = x.Product.ImageUrl,
                    AverageRating = x.Product.AverageRating,
                    ViewedAt = x.ViewedAt
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}