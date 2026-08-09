using Ecommerce.DTOs;

namespace Ecommerce.Services.AI
{
    public interface IEmbeddingService
    {
        Task<float[]> GenerateEmbeddingAsync(string text);
    }

    public interface IVectorSearchService
    {
        Task UpsertProductAsync(int id, string name, string description, decimal price, string imageUrl, float[] embedding);
        Task<List<ProductSearchResultDto>> SearchSimilarProductsAsync(float[] queryEmbedding, int limit = 5);
    }

    public interface IPromptService
    {
        string BuildRAGPrompt(string userQuery, List<ProductSearchResultDto> products);
    }

    
}