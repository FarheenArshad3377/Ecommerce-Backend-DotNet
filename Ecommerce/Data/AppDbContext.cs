using Ecommerce.Models;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // ─── Tables ───────────────────────────────────────
        public DbSet<UserModel> Users { get; set; }
        public DbSet<CategoryModel> Categories { get; set; }
        public DbSet<ProductModel> Products { get; set; }
        public DbSet<ProductImageModel> ProductImages { get; set; }
        public DbSet<AddressModel> Addresses { get; set; }
        public DbSet<CartModel> Carts { get; set; }
        public DbSet<CartItemModel> CartItems { get; set; }
        public DbSet<OrderModel> Orders { get; set; }
        public DbSet<OrderItemModel> OrderItems { get; set; }
        public DbSet<PaymentModel> Payments { get; set; }
        public DbSet<ReviewModel> Reviews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ─── User ──────────────────────────────────────
            modelBuilder.Entity<UserModel>()
                .HasIndex(u => u.Email)
                .IsUnique();                            // Email unique hoga

            // ─── Category Self Referencing ─────────────────
            modelBuilder.Entity<CategoryModel>()
                .HasOne(c => c.ParentCategory)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentCategoryID)
                .OnDelete(DeleteBehavior.Restrict);     // Parent delete hone se children delete na hon

            // ─── Product → Category ────────────────────────
            modelBuilder.Entity<ProductModel>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);

            // ─── Cart → User (One to One) ──────────────────
            modelBuilder.Entity<CartModel>()
                .HasOne(c => c.User)
                .WithOne(u => u.Cart)
                .HasForeignKey<CartModel>(c => c.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            // ─── Order → Address ───────────────────────────
            modelBuilder.Entity<OrderModel>()
                .HasOne(o => o.Address)
                .WithMany(a => a.Orders)
                .HasForeignKey(o => o.AddressID)
                .OnDelete(DeleteBehavior.Restrict);

            // ─── Payment → Order (One to One) ─────────────
            modelBuilder.Entity<PaymentModel>()
                .HasOne(p => p.Order)
                .WithOne(o => o.Payment)
                .HasForeignKey<PaymentModel>(p => p.OrderID)
                .OnDelete(DeleteBehavior.Cascade);

            // ─── Order Number Unique ───────────────────────
            modelBuilder.Entity<OrderModel>()
                .HasIndex(o => o.OrderNumber)
                .IsUnique();
        }
    }
}