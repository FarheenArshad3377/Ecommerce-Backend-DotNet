using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Models
{
    public class CategoryModel
    {
        [Key]
        public int CategoryID { get; set; }

        [Required]
        [MinLength(2)]
        [MaxLength(100)]
        public string CategoryName { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }        // Optional

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public int DisplayOrder { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }

        // ─── Self Referencing (Sub Categories) ──────────
        public int? ParentCategoryID { get; set; }      // Nullable!

        // ─── Navigation Properties ───────────────────────
        public CategoryModel? ParentCategory { get; set; }             // Parent category object
        public ICollection<CategoryModel> SubCategories { get; set; }  // Children
        public ICollection<ProductModel> Products { get; set; }        // Is category ke products
    }
}