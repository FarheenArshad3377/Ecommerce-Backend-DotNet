using System;

namespace Ecommerce.DTOs
{
    public class RecentlyViewedDto
    {
        public int ProductID { get; set; }
        public string ProductName { get; set; }
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public string ImageUrl { get; set; }
        public double AverageRating { get; set; }
        public DateTime ViewedAt { get; set; }
    }
}