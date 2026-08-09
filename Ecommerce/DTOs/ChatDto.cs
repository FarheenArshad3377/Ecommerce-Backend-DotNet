namespace Ecommerce.DTOs
{
    public class ChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
    }

    public class ChatResponseDto
    {
        public string Response { get; set; } = string.Empty;
        public List<ProductSearchResultDto> ContextProducts { get; set; } = new();
    }

    public class ProductSearchResultDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public double Score { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
    }
}