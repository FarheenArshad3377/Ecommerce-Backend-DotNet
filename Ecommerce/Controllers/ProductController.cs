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
        private readonly IWebHostEnvironment _environment;

        // IWebHostEnvironment ko inject kiya taaki server par files save ki ja sakein
        public ProductsController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // =========================================================
        // GET: api/products/search
        // =========================================================
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int limit = 6)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<object>());

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
        // GET: api/products/filter
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

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(p => p.ProductName.ToLower().Contains(term) ||
                                         (p.Description != null && p.Description.ToLower().Contains(term)));
            }

            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryID == categoryId.Value);

            if (minPrice.HasValue)
                query = query.Where(p => (p.DiscountPrice ?? p.Price) >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => (p.DiscountPrice ?? p.Price) <= maxPrice.Value);

            if (minRating.HasValue)
                query = query.Where(p => p.AverageRating >= minRating.Value);

            if (inStockOnly)
                query = query.Where(p => p.Stock > 0);

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
                    p.Description,
                    p.Price,
                    p.DiscountPrice,
                    p.Stock,
                    p.SKU,
                    p.ImageUrl,
                    p.IsFeatured,
                    p.AverageRating,
                    p.TotalReviews,
                    p.CategoryID, // 👈 Added here for Admin Edit matching pipeline
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

        // =========================================================
        // GET: api/products
        // =========================================================
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
                    p.Description,
                    p.Price,
                    p.DiscountPrice,
                    p.Stock,
                    p.SKU,
                    p.ImageUrl,
                    p.IsFeatured,
                    p.AverageRating,
                    p.TotalReviews,
                    p.CategoryID, // 👈 Added here to fix the Admin Inventory Form view context
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

        // =========================================================
        // GET: api/products/5
        // =========================================================
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

        // =========================================================
        // FIXED POST: [FromForm] implemented with disk write logic
        // =========================================================
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] CreateProductRequest dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            bool categoryExists = await _context.Categories.AnyAsync(c => c.CategoryID == dto.CategoryID);
            if (!categoryExists)
                return BadRequest(new { message = "Category not found." });

            string? dbImageUrl = dto.ImageUrl;

            // Agar user ne file upload ki hai toh usko server local directory me write karenge
            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(dto.ImageFile.FileName);
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ImageFile.CopyToAsync(fileStream);
                }

                dbImageUrl = "/uploads/" + uniqueFileName;
            }

            var product = new ProductModel
            {
                ProductName = dto.ProductName,
                Description = dto.Description,
                Price = dto.Price,
                DiscountPrice = dto.DiscountPrice,
                Stock = dto.Stock,
                SKU = dto.SKU,
                ImageUrl = dbImageUrl,
                IsFeatured = dto.IsFeatured,
                IsActive = true,
                CategoryID = dto.CategoryID,
                CreatedDate = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return Ok(new { product.ProductID, product.ProductName });
        }

        // =========================================================
        // FIXED PUT: [FromForm] handling image modifications
        // =========================================================
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] CreateProductRequest dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Nayi image upload logic
            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(dto.ImageFile.FileName);
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ImageFile.CopyToAsync(fileStream);
                }

                product.ImageUrl = "/uploads/" + uniqueFileName;
            }

            product.ProductName = dto.ProductName;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.DiscountPrice = dto.DiscountPrice;
            product.Stock = dto.Stock;
            product.SKU = dto.SKU;
            product.IsFeatured = dto.IsFeatured;
            product.CategoryID = dto.CategoryID;
            product.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Product updated successfully." });
        }

        // =========================================================
        // DELETE: api/products/5
        // =========================================================
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

    // DTO keeps matching Angular context rules flawlessly
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
        public IFormFile? ImageFile { get; set; }
    }
}