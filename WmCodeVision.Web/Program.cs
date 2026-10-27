using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddResponseCompression(options => options.EnableForHttps = true);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseResponseCompression();
app.UseDefaultFiles();
var contentTypes = new FileExtensionContentTypeProvider();
contentTypes.Mappings[".webmanifest"] = "application/manifest+json";
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypes,
    OnPrepareResponse = context =>
    {
        if (context.File.Name is "service-worker.js" or "manifest.webmanifest")
        {
            context.Context.Response.Headers.CacheControl = "no-cache";
            return;
        }
        // Keep public pages briefly; reuse artwork and films across page visits.
        var extension = Path.GetExtension(context.File.Name).ToLowerInvariant();
        var maxAge = extension is ".jpg" or ".jpeg" or ".png" or ".mp4" ? 86400 : 60;
        context.Context.Response.Headers.CacheControl = $"public,max-age={maxAge}";
    }
});

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    application = "W&M Code & Vision",
    framework = ".NET 10"
}));

app.MapGet("/error", () => Results.Problem("Something went wrong. Please try again."));

app.Run();
