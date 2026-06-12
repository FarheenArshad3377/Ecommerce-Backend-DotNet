using System.Security.Claims;
using Ecommerce.Data;
using Ecommerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AddressesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET: api/addresses
        [HttpGet]
        public async Task<IActionResult> GetMyAddresses()
        {
            int userId = GetUserId();
            var addresses = await _context.Addresses
                .Where(a => a.UserID == userId)
                .OrderByDescending(a => a.IsDefault)
                .ToListAsync();

            return Ok(addresses);
        }

        // POST: api/addresses
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddressModel dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int userId = GetUserId();
            dto.UserID = userId;

            // Agar pehla address hai ya IsDefault true hai to baaki sab ko false karo
            if (dto.IsDefault)
            {
                var existing = await _context.Addresses.Where(a => a.UserID == userId).ToListAsync();
                existing.ForEach(a => a.IsDefault = false);
            }

            bool hasAny = await _context.Addresses.AnyAsync(a => a.UserID == userId);
            if (!hasAny)
                dto.IsDefault = true;    // Pehla address automatically default

            _context.Addresses.Add(dto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyAddresses), new { }, dto);
        }

        // PUT: api/addresses/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AddressModel dto)
        {
            int userId = GetUserId();

            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.AddressID == id && a.UserID == userId);

            if (address == null)
                return NotFound(new { message = "Address not found." });

            address.FullName = dto.FullName;
            address.PhoneNumber = dto.PhoneNumber;
            address.Street = dto.Street;
            address.City = dto.City;
            address.State = dto.State;
            address.Country = dto.Country;
            address.PostalCode = dto.PostalCode;

            if (dto.IsDefault && !address.IsDefault)
            {
                var others = await _context.Addresses
                    .Where(a => a.UserID == userId && a.AddressID != id)
                    .ToListAsync();
                others.ForEach(a => a.IsDefault = false);
                address.IsDefault = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Address updated." });
        }

        // PUT: api/addresses/5/set-default
        [HttpPut("{id}/set-default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            int userId = GetUserId();

            var addresses = await _context.Addresses.Where(a => a.UserID == userId).ToListAsync();
            var target = addresses.FirstOrDefault(a => a.AddressID == id);

            if (target == null)
                return NotFound(new { message = "Address not found." });

            addresses.ForEach(a => a.IsDefault = false);
            target.IsDefault = true;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Default address updated." });
        }

        // DELETE: api/addresses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            int userId = GetUserId();

            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.AddressID == id && a.UserID == userId);

            if (address == null)
                return NotFound(new { message = "Address not found." });

            bool usedInOrder = await _context.Orders.AnyAsync(o => o.AddressID == id);
            if (usedInOrder)
                return BadRequest(new { message = "Cannot delete address used in an order." });

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Address deleted." });
        }
    }
}