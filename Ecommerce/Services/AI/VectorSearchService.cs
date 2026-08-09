using Qdrant.Client;
using Qdrant.Client.Grpc;
using Ecommerce.DTOs;

namespace Ecommerce.Services.AI
{
    public class VectorSearchService : IVectorSearchService
    {
        private readonly QdrantClient _client;
        private const string CollectionName = "products";

        public VectorSearchService(IConfiguration configuration)
        {
            var endpoint = configuration["Qdrant:Endpoint"];
            var apiKey = configuration["Qdrant:ApiKey"];

            _client = new QdrantClient(new Uri(endpoint!), apiKey);
        }

        public async Task UpsertProductAsync(int id, string name, string description, decimal price, string imageUrl, float[] embedding)
        {
            var exists = await _client.CollectionExistsAsync(CollectionName);
            if (!exists)
            {
                await _client.CreateCollectionAsync(CollectionName, new VectorParams
                {
                    Size = (ulong)embedding.Length,
                    Distance = Distance.Cosine
                });
            }

            var point = new PointStruct
            {
                Id = (ulong)id,
                Vectors = embedding,
                Payload =
        {
            ["id"] = id,
            ["name"] = name,
            ["description"] = description,
            ["price"] = (double)price,
            ["imageUrl"] = imageUrl ?? string.Empty   // 👈 add this
        }
            };

            await _client.UpsertAsync(CollectionName, new[] { point });
        }

        public async Task<List<ProductSearchResultDto>> SearchSimilarProductsAsync(float[] queryEmbedding, int limit = 5)
        {
            var exists = await _client.CollectionExistsAsync(CollectionName);
            if (!exists) return new List<ProductSearchResultDto>();

            var searchResults = await _client.QueryAsync(
                collectionName: CollectionName,
                query: queryEmbedding,
                limit: (ulong)limit
            );

            var results = new List<ProductSearchResultDto>();
            foreach (var point in searchResults)
            {
                results.Add(new ProductSearchResultDto
                {
                    Id = (int)point.Payload["id"].IntegerValue,
                    Name = point.Payload["name"].StringValue,
                    Description = point.Payload["description"].StringValue,
                    Price = (decimal)point.Payload["price"].DoubleValue,
                    Score = point.Score,
                    ImageUrl = point.Payload.ContainsKey("imageUrl") ? point.Payload["imageUrl"].StringValue : string.Empty   // 👈 add this
                });
            }

            return results;
        }
    }
}