using System.Text;
using Ecommerce.DTOs;

namespace Ecommerce.Services.AI
{
    public class PromptService : IPromptService
    {
        public string BuildRAGPrompt(string userQuery, List<ProductSearchResultDto> products)
        {
            var sb = new StringBuilder();
            sb.AppendLine("You are a friendly and helpful e-commerce shopping assistant.");
            sb.AppendLine("Use ONLY the product context below to answer the user's question.");
            sb.AppendLine("If an exact match isn't available, recommend the closest relevant product(s) from the context naturally, without apologizing excessively.");
            sb.AppendLine("If nothing in the context is even remotely relevant, politely say you couldn't find a matching product.");
            sb.AppendLine("Keep your tone conversational and concise, like a helpful store assistant — not robotic.");
            sb.AppendLine();
            sb.AppendLine("--- AVAILABLE PRODUCTS CONTEXT ---");

            if (products == null || products.Count == 0)
            {
                sb.AppendLine("No relevant products found.");
            }
            else
            {
                foreach (var p in products)
                {
                    sb.AppendLine($"- ID: {p.Id} | Name: {p.Name} | Price: Rs. {p.Price} | Relevance Score: {p.Score:F2}");
                    sb.AppendLine($"  Description: {p.Description}");
                }
            }

            sb.AppendLine("----------------------------------");
            sb.AppendLine($"User Query: {userQuery}");
            sb.AppendLine("Response:");

            return sb.ToString();
        }
    }
}