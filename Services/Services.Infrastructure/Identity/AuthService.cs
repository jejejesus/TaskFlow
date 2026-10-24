using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Services.Application.DTOs.Auth;
using Services.Application.Interfaces.Services;

namespace Services.Infrastructure.Identity;

public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    JwtTokenGenerator tokenGenerator) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var email = request.Email.Trim();

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ValidationException("El correo electrónico es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationException("La contraseña es obligatoria.");
        }

        if (await userManager.FindByEmailAsync(email) is not null)
        {
            throw new ValidationException(
                "Ya existe una cuenta con ese correo electrónico.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(
                " ",
                result.Errors.Select(error => error.Description));

            throw new ValidationException(errors);
        }

        return tokenGenerator.Generate(user.Id, user.Email!);
    }

    public async Task<AuthResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var email = request.Email.Trim();
        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            throw new UnauthorizedAccessException(
                "Correo electrónico o contraseña incorrectos.");
        }

        var result = await signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            throw new UnauthorizedAccessException(
                "Correo electrónico o contraseña incorrectos.");
        }

        return tokenGenerator.Generate(user.Id, user.Email!);
    }

    public async Task LogoutAsync(CancellationToken cancellationToken = default)
    {
        await signInManager.SignOutAsync();
    }
}