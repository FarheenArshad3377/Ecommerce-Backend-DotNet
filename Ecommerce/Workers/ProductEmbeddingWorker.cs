using Ecommerce.Data;
using Ecommerce.Services.AI;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Workers
{
    public class ProductEmbeddingWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ProductEmbeddingWorker> _logger;

        public ProductEmbeddingWorker(IServiceProvider serviceProvider, ILogger<ProductEmbeddingWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Starting Initial Product Embedding Sync...");

            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var embeddingService = scope.ServiceProvider.GetRequiredService<IEmbeddingService>();
                var vectorSearchService = scope.ServiceProvider.GetRequiredService<IVectorSearchService>();

                try
                {
                    var products = await dbContext.Products.ToListAsync(stoppingToken);

                    foreach (var product in products)
                    {
                        // Note: Agar aapke ProductModel mein properties ProductId / ProductName hain, 
                        // toh niche wale lines mein unko apne model ke mutabiq adjust kar lein.
                        int id = product.ProductID; // ya product.ProductId
                        string name = product.ProductName; // ya product.ProductName / product.Title
                        string description = product.Description ?? "";
                        decimal price = product.Price;
                        string imageUrl = product.ImageUrl ?? "";
                        var textToEmbed = $"{name} {description}";
                        var embedding = await embeddingService.GenerateEmbeddingAsync(textToEmbed);

                        await vectorSearchService.UpsertProductAsync(
                            id,
                            name,
                            description,
                            price,
                            imageUrl,
                            embedding
                        );
                    }
                    _logger.LogInformation("Successfully synced {Count} products to Qdrant.", products.Count);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while syncing embeddings to Qdrant.");
                }
            }
        }
    }
}