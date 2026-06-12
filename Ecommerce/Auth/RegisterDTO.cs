using System.ComponentModel.DataAnnotations;

namespace Ecommerce.DTOs.Auth
{
    public class RegisterDTO
    {
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; }

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MinLength(8)]
        public string Password { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }
    }
}