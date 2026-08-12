using Ecommerce.Data;
using Ecommerce.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Ecommerce.Services.AI;
using Ecommerce.Workers;
using Ecommerce.Models; // Agar aapka User model 'Models' folder mein hai
// YA
var builder = WebApplication.CreateBuilder(args);

// ─── Database ────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── JWT Service (DI) ────────────────────────────────────────────────────────
builder.Services.AddScoped<JwtService>();

// ─── JWT Authentication ──────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ─── CORS ────────────────────────────────────────────────────────────────────
// 👇 Vercel deploy hone tak sab origins allow (testing ke liye).
// Jab Vercel URL mil jaye, ise WithOrigins(...) mein exact URL se replace kar dena — safer hai.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)   // 👈 Temporary — sab origins allow karega
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ─── Controllers ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ─── Swagger (API docs/testing) ──────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
});
// HttpClient for Gemini API Calls
builder.Services.AddHttpClient();

// Inject AI Services
builder.Services.AddScoped<IEmbeddingService, EmbeddingService>();
builder.Services.AddScoped<IVectorSearchService, VectorSearchService>();
builder.Services.AddScoped<IPromptService, PromptService>();
builder.Services.AddScoped<IChatbotService, ChatbotService>();

// Register Background Auto-Sync Worker
builder.Services.AddHostedService<ProductEmbeddingWorker>();

// ─── Build App ───────────────────────────────────────────────────────────────
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        // Ensure Database is Created & up-to-date
        context.Database.EnsureCreated();

        // 1. Check if Admin Account exists by Email
        var adminEmail = "admin@redtag.com";
        var adminExists = context.Users.Any(u => u.Email == adminEmail);
        if (!adminExists)
        {
            var adminUser = new Ecommerce.Models.UserModel
            {
                FirstName = "System",
                LastName = "Admin",
                Email = adminEmail,
                Role = "Admin",
                IsActive = true,
                CreatedDate = DateTime.UtcNow,

                // ⚠️ Plain text string hatayein! Agar aap BCrypt use kar rahe hain to aise likhein:
                // PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123")

                // Agar aap normal custom string encryption use kar rahe hain to wo method yahan call karein.
                PasswordHash = "YAHAN_APNA_HASHED_PASSWORD_DAALEIN"
            };

            context.Users.Add(adminUser);
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>>> [SEEDER ERROR]: Admin seed fail ho gaya: {ex.Message} <<<<");
    }
}
// 👇 Swagger — ab Development AUR Production dono mein chalega (testing ke liye)
app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection();   // ⚠️ local dev ke liye comment out — HTTP requests block ho rahe the isse
app.UseCors("AllowFrontend");   // CORS Auth se pehle hona chahiye
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();