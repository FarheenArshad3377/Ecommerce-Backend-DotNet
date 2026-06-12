using System.Security.Claims;
using Ecommerce.Data;
using Ecommerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET: api/reviews/product/5  — Public
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.ProductID == productId && r.IsApproved)
                .OrderByDescending(r => r.CreatedDate)
                .Select(r => new
                {
                    r.ReviewID,
                    r.Rating,
                    r.Comment,
                    r.CreatedDate,
                    UserName = r.User.FirstName + " " + r.User.LastName
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // POST: api/reviews  — Logged in user
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Add([FromBody] AddReviewRequest request)
        {
            int userId = GetUserId();

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null || !product.IsActive)
                return NotFound(new { message = "Product not found." });

            // Check: user ne yeh product kharida hai ya nahi
            bool hasPurchased = await _context.OrderItems
                .Include(oi => oi.Order)
                .AnyAsync(oi => oi.ProductID == request.ProductId
                             && oi.Order.UserID == userId
                             && oi.Order.Status == "Delivered");

            if (!hasPurchased)
                return BadRequest(new { message = "You can only review products you have purchased and received." });

            // Check: pehle se review diya hai ya nahi
            bool alreadyReviewed = await _context.Reviews
                .AnyAsync(r => r.ProductID == request.ProductId && r.UserID == userId);

            if (alreadyReviewed)
                return BadRequest(new { message = "You have already reviewed this product." });

            var review = new ReviewModel
            {
                ProductID = request.ProductId,
                UserID = userId,
                Rating = request.Rating,
                Comment = request.Comment,
                IsApproved = false    // Admin approve karega
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Review submitted. It will be visible after approval." });
        }

        // DELETE: api/reviews/5  — User apna review delete kare
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            int userId = GetUserId();
            bool isAdmin = User.IsInRole("Admin");

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.ReviewID == id && (isAdmin || r.UserID == userId));

            if (review == null)
                return NotFound(new { message = "Review not found." });

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            // Product ka average rating recalculate karo
            await UpdateProductRating(review.ProductID);

            return Ok(new { message = "Review deleted." });
        }

        // PUT: api/reviews/admin/5/approve  — Admin
        [HttpPut("admin/{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
                return NotFound(new { message = "Review not found." });

            review.IsApproved = true;
            await _context.SaveChangesAsync();

            await UpdateProductRating(review.ProductID);

            return Ok(new { message = "Review approved." });
        }

        // GET: api/reviews/admin/pending  — Admin: pending reviews
        [HttpGet("admin/pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPending()
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Product)
                .Where(r => !r.IsApproved)
                .OrderByDescending(r => r.CreatedDate)
                .Select(r => new
                {
                    r.ReviewID,
                    r.Rating,
                    r.Comment,
                    r.CreatedDate,
                    UserName = r.User.FirstName + " " + r.User.LastName,
                    ProductName = r.Product.ProductName
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // Helper: product ka average rating update karo
        private async Task UpdateProductRating(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return;

            var approved = await _context.Reviews
                .Where(r => r.ProductID == productId && r.IsApproved)
                .ToListAsync();

            product.TotalReviews = approved.Count;
            product.AverageRating = approved.Any() ? approved.Average(r => r.Rating) : 0;
            product.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
    }

    public class AddReviewRequest
    {
        public int ProductId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}