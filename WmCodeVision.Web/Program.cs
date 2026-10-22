var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    application = "W&M Code & Vision",
    framework = ".NET 10"
}));

app.MapGet("/error", () => Results.Problem("Something went wrong. Please try again."));

app.Run();
