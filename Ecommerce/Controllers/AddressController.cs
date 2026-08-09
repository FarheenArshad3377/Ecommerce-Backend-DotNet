using Ecommerce.Data;
using Ecommerce.DTOs;
using Ecommerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
        public async Task<IActionResult> Add([FromBody] CreateAddressDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int userId = GetUserId();

            var address = new AddressModel
            {
                UserID = userId,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Street = dto.Street,
                City = dto.City,
                State = dto.State,
                Country = dto.Country,
                PostalCode = dto.PostalCode,
                IsDefault = dto.IsDefault
            };

            if (address.IsDefault)
            {
                var existing = await _context.Addresses.Where(a => a.UserID == userId).ToListAsync();
                existing.ForEach(a => a.IsDefault = false);
            }

            bool hasAny = await _context.Addresses.AnyAsync(a => a.UserID == userId);
            if (!hasAny)
                address.IsDefault = true;

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyAddresses), new { }, address);
        }

        // PUT: api/addresses/5
        [HttpPut("{id}")]
        // PUT: api/addresses/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAddressDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

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