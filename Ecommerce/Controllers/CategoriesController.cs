using Ecommerce.Data;
using Ecommerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/categories
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _context.Categories
                .Include(c => c.SubCategories)
                .Where(c => c.IsActive && c.ParentCategoryID == null)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new
                {
                    c.CategoryID,
                    c.CategoryName,
                    c.Description,
                    c.ImageUrl,
                    c.DisplayOrder,
                    SubCategories = c.SubCategories
                        .Where(s => s.IsActive)
                        .OrderBy(s => s.DisplayOrder)
                        .Select(s => new
                        {
                            s.CategoryID,
                            s.CategoryName,
                            s.ImageUrl,
                            s.DisplayOrder
                        })
                })
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/categories/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _context.Categories
                .Include(c => c.SubCategories)
                .Include(c => c.ParentCategory)
                .FirstOrDefaultAsync(c => c.CategoryID == id && c.IsActive);

            if (category == null)
                return NotFound(new { message = "Category not found." });

            return Ok(new
            {
                category.CategoryID,
                category.CategoryName,
                category.Description,
                category.ImageUrl,
                category.DisplayOrder,
                ParentCategory = category.ParentCategory == null ? null : new
                {
                    category.ParentCategory.CategoryID,
                    category.ParentCategory.CategoryName
                },
                SubCategories = category.SubCategories
                    .Where(s => s.IsActive)
                    .Select(s => new { s.CategoryID, s.CategoryName, s.ImageUrl })
            });
        }

        // POST: api/categories  — Admin only
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateCategoryRequest dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.ParentCategoryID.HasValue)
            {
                bool parentExists = await _context.Categories.AnyAsync(c => c.CategoryID == dto.ParentCategoryID);
                if (!parentExists)
                    return BadRequest(new { message = "Parent category not found." });
            }

            var category = new CategoryModel
            {
                CategoryName = dto.CategoryName,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive,
                ParentCategoryID = dto.ParentCategoryID
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(new { category.CategoryID, category.CategoryName });
        }

        // PUT: api/categories/5  — Admin only
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateCategoryRequest dto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found." });

            category.CategoryName = dto.CategoryName;
            category.Description = dto.Description;
            category.ImageUrl = dto.ImageUrl;
            category.DisplayOrder = dto.DisplayOrder;
            category.IsActive = dto.IsActive;
            category.ParentCategoryID = dto.ParentCategoryID;
            category.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Category updated successfully." });
        }

        // DELETE: api/categories/5  — Admin only
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found." });

            bool hasProducts = await _context.Products.AnyAsync(p => p.CategoryID == id && p.IsActive);
            if (hasProducts)
                return BadRequest(new { message = "Cannot delete category with active products." });

            category.IsActive = false;
            category.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Category deactivated successfully." });
        }
    }

    // ─── Request DTO ─────────────────────────────────────────────────────────
    public class CreateCategoryRequest
    {
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public int? ParentCategoryID { get; set; }
    }
}