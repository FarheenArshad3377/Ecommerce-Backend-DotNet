using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.Models
{
    public class RecentlyViewedModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserID { get; set; }

        [ForeignKey("UserID")]
        public UserModel User { get; set; }

        [Required]
        public int ProductID { get; set; }

        [ForeignKey("ProductID")]
        public ProductModel Product { get; set; }

        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}