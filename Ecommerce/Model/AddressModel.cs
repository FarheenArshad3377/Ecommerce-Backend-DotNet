using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Models
{
    public class AddressModel
    {
        [Key]
        public int AddressID { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; }

        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; }

        [Required]
        [MaxLength(200)]
        public string Street { get; set; }

        [Required]
        [MaxLength(100)]
        public string City { get; set; }

        [Required]
        [MaxLength(100)]
        public string State { get; set; }

        [Required]
        [MaxLength(100)]
        public string Country { get; set; }

        [Required]
        [MaxLength(20)]
        public string PostalCode { get; set; }

        public bool IsDefault { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // ─── Foreign Keys ─────────────────────────────────
        public int UserID { get; set; }

        // ─── Navigation Properties ─────────────────────────
        public UserModel User { get; set; }
        public ICollection<OrderModel> Orders { get; set; }
    }
}