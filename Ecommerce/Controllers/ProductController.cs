using Ecommerce.Data;
using Ecommerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // NEW: GET: api/products/search?q=shirt&limit=6
        // Autocomplete Search Endpoint for Header & Chatbot
        // =========================================================
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int limit = 6)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new List<object>());
            }

            var searchTerm = q.Trim().ToLower();

            var products = await _context.Products
                .Where(p => p.IsActive &&
                           (p.ProductName.ToLower().Contains(searchTerm) ||
                            (p.Description != null && p.Description.ToLower().Contains(searchTerm))))
                .Take(limit)
                .Select(p => new
                {
                    id = p.ProductID,
                    name = p.ProductName,
                    price = p.DiscountPrice ?? p.Price,
                    imageUrl = p.ImageUrl,
                    stock = p.Stock
                })
                .ToListAsync();

            return Ok(products);
        }

        // =========================================================
        // NEW: GET: api/products/filter?search=shirt&categoryId=2...
        // Advanced Filter & Pagination Endpoint
        // =========================================================
        [HttpGet("filter")]
        public async Task<IActionResult> GetFiltered(
            [FromQuery] string? search = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] double? minRating = null,
            [FromQuery] bool inStockOnly = false,
            [FromQuery] string sortBy = "price_asc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 24)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsActive)
                .AsQueryable();

            // 1. Text Search Filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(p => p.ProductName.ToLower().Contains(term) ||
                                         (p.Description != null && p.Description.ToLower().Contains(term)));
            }

            // 2. Category Filter
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryID == categoryId.Value);
            }

            // 3. Price Filter
            if (minPrice.HasValue)
            {
                query = query.Where(p => (p.DiscountPrice ?? p.Price) >= minPrice.Value);
            }
            if (maxPrice.HasValue)
            {
                query = query.Where(p => (p.DiscountPrice ?? p.Price) <= maxPrice.Value);
            }

            // 4. Rating Filter
            if (minRating.HasValue)
            {
                query = query.Where(p => p.AverageRating >= minRating.Value);
            }

            // 5. In-Stock Filter
            if (inStockOnly)
            {
                query = query.Where(p => p.Stock > 0);
            }

            // 6. Dynamic Sorting Logic
            query = sortBy.ToLower() switch
            {
                "price_asc" => query.OrderBy(p => p.DiscountPrice ?? p.Price),
                "price_desc" => query.OrderByDescending(p => p.DiscountPrice ?? p.Price),
                "rating" => query.OrderByDescending(p => p.AverageRating),
                "name_asc" => query.OrderBy(p => p.ProductName),
                "name_desc" => query.OrderByDescending(p => p.ProductName),
                _ => query.OrderByDescending(p => p.CreatedDate)
            };

            int total = await query.CountAsync();

            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.ProductID,
                    p.ProductName,
                    p.Price,
                    p.DiscountPrice,
                    p.Stock,
                    p.SKU,
                    p.ImageUrl,
                    p.IsFeatured,
                    p.AverageRating,
                    p.TotalReviews,
                    Category = p.Category != null ? p.Category.CategoryName : null,
                    Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl)
                })
                .ToListAsync();

            return Ok(new
            {
                data = products,
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)total / pageSize)
            });
        }

        // GET: api/products
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? search = null,
            [FromQuery] bool? isFeatured = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string sortBy = "newest")
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsActive)
                .AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryID == categoryId);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(p => p.ProductName.Contains(search) || p.Description.Contains(search));

            if (isFeatured.HasValue)
                query = query.Where(p => p.IsFeatured == isFeatured);

            if (minPrice.HasValue)
                query = query.Where(p => (p.DiscountPrice ?? p.Price) >= minPrice);

            if (maxPrice.HasValue)
                query = query.Where(p => (p.DiscountPrice ?? p.Price) <= maxPrice);

            query = sortBy switch
            {
                "price_asc" => query.OrderBy(p => p.DiscountPrice ?? p.Price),
                "price_desc" => query.OrderByDescending(p => p.DiscountPrice ?? p.Price),
                "rating" => query.OrderByDescending(p => p.AverageRating),
                _ => query.OrderByDescending(p => p.CreatedDate)
            };

            int total = await query.CountAsync();

            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.ProductID,
                    p.ProductName,
                    p.Price,
                    p.DiscountPrice,
                    p.Stock,
                    p.SKU,
                    p.ImageUrl,
                    p.IsFeatured,
                    p.AverageRating,
                    p.TotalReviews,
                    Category = p.Category != null ? p.Category.CategoryName : null,
                    Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl)
                })
                .ToListAsync();

            return Ok(new
            {
                data = products,
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)total / pageSize)
            });
        }

        // GET: api/products/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.Reviews).ThenInclude(r => r.User)
                .FirstOrDefaultAsync(p => p.ProductID == id && p.IsActive);

            if (product == null)
                return NotFound(new { message = "Product not found." });

            return Ok(new
            {
                product.ProductID,
                product.ProductName,
                product.Description,
                product.Price,
                product.DiscountPrice,
                product.Stock,
                product.SKU,
                product.ImageUrl,
                product.IsFeatured,
                product.AverageRating,
                product.TotalReviews,
                product.CreatedDate,
                Category = product.Category != null ? new { product.Category.CategoryID, product.Category.CategoryName } : null,
                Images = product.Images.OrderBy(i => i.DisplayOrder)
                    .Select(i => new { i.ImageID, i.ImageUrl, i.IsMain }),
                Reviews = product.Reviews.Where(r => r.IsApproved)
                    .OrderByDescending(r => r.CreatedDate)
                    .Select(r => new
                    {
                        r.ReviewID,
                        r.Rating,
                        r.Comment,
                        r.CreatedDate,
                        UserName = r.User != null ? r.User.FirstName + " " + r.User.LastName : "Anonymous"
                    })
            });
        }

        // POST: api/products — Admin only
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateProductRequest dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            bool categoryExists = await _context.Categories.AnyAsync(c => c.CategoryID == dto.CategoryID);
            if (!categoryExists)
                return BadRequest(new { message = "Category not found." });

            var product = new ProductModel
            {
                ProductName = dto.ProductName,
                Description = dto.Description,
                Price = dto.Price,
                DiscountPrice = dto.DiscountPrice,
                Stock = dto.Stock,
                SKU = dto.SKU,
                ImageUrl = dto.ImageUrl,
                IsFeatured = dto.IsFeatured,
                IsActive = true,
                CategoryID = dto.CategoryID
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return Ok(new { product.ProductID, product.ProductName });
        }

        // PUT: api/products/5 — Admin only
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateProductRequest dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found." });

            product.ProductName = dto.ProductName;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.DiscountPrice = dto.DiscountPrice;
            product.Stock = dto.Stock;
            product.SKU = dto.SKU;
            product.ImageUrl = dto.ImageUrl;
            product.IsFeatured = dto.IsFeatured;
            product.CategoryID = dto.CategoryID;
            product.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Product updated successfully." });
        }

        // DELETE: api/products/5 — Admin only (soft delete)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found." });

            product.IsActive = false;
            product.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product deactivated successfully." });
        }
    }

    // ─── Request DTO ─────────────────────────────────────────────────────────
    public class CreateProductRequest
    {
        public string ProductName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int Stock { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public bool IsFeatured { get; set; } = false;
        public int CategoryID { get; set; }
    }
}