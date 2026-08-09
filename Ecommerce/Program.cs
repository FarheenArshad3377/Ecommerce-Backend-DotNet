using Ecommerce.Data;
using Ecommerce.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Ecommerce.Services.AI;
using Ecommerce.Workers;

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