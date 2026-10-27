# W&M Code & Vision

ASP.NET Core web app built with C# and .NET 10. Open `W-M-Code-Vision.sln` in Visual Studio and press **F5** to run it.

## Project
- `WmCodeVision.Web` — ASP.NET Core app
- `WmCodeVision.Web/wwwroot` — website HTML, CSS, JavaScript, and logo
- `GET /health` — simple health check

## Run
1. Open `W-M-Code-Vision.sln` in Visual Studio.
2. Set `WmCodeVision.Web` as the startup project if prompted.
3. Press **F5** (or **Ctrl+F5**).

The enquiry form sends submissions through FormSubmit to `info.wmcodevision@gmail.com`. The first submission may require the recipient to activate the email address through FormSubmit.

## Installable website (PWA)
The ASP.NET project serves the manifest, company-logo icons and service worker from `wwwroot`. Publish the entire project output together. The manifest and registration use relative paths, supporting the domain root in the current publish profile as well as subfolder hosting. A subfolder host must serve the app at a trailing-slash base URL.

Production installation requires HTTPS. The current publish profile's launch URL is HTTP; use the site's HTTPS address and ensure the host has a valid certificate. In Edge or Chrome, use the browser's install option; on iPhone/iPad, use Safari's Share > Add to Home Screen.

After the first successful online load, the five main pages, styles, scripts, icons and selected artwork are available offline. Videos, full-size drone photos, external fonts/sites and contact submissions require a connection. The contact page warns when offline and prevents submission while the browser reports no connection. No enquiry data is queued or cached.

The worker prefers the network with a five-second timeout and falls back to saved files. Its explicit file list bounds storage. Increment the version in `wwwroot/service-worker.js` whenever changing the offline shell or asset list. An update waits until the previous app tabs close, then removes only this app scope's older caches. The server revalidates the manifest and worker rather than keeping them in a long-lived HTTP cache.
