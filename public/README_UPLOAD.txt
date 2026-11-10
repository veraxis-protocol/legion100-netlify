LEGION — Netlify Drop site (public URL immediately)

1. Unzip LEGION_NETLIFY_DROP_001.zip.
2. Open https://app.netlify.com/drop and sign into the correct Netlify team.
3. Drag the FOLDER named LEGION_NETLIFY_DROP_001 (the folder containing index.html) into the Drop zone.
4. Netlify will issue a live *.netlify.app URL. Open it.
5. Click "Try a sample order"; optionally test real CSV/DXF/JSON uploads.

THIS IS A FUNCTIONAL STATIC WEBSITE / INTERACTIVE LOCAL INTAKE, NOT YET AN OPERATIONAL COMMERCE BACKEND.
- CSV, JSON, DXF INSERT entities and explicitly annotated SVG are locally parsed, with a SHA-256 file fingerprint.
- PDF, STEP/STL, machine-generated drawings without explicit parts require a connected engineering service.
- Offers, buyer coalition, agents and prices in Try Sample are labelled test fixtures.
- NIM, ZTL engineering verification, supplier feeds, and PayPal Sandbox are not connected in a static Drop deploy.
- No card info, secret key or NIM token belongs in this public folder.
- A separate FULL SOURCE package has optional serverless functions; it requires Netlify source/CLI deployment and server-side env configuration.
