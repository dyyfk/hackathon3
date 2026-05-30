# Newest Airbnb Homepage Clone Spec

Scope: research/design notes only for the newest pages, plus route naming. Do not treat this as an implementation patch.

## Route Naming

Use date-first hash routes so the version switcher can sort chronologically and avoid subjective labels as primary IDs:

- `#/v/2008-08-11-airbed-and-breakfast`
- `#/v/2009-03-01-airbnb-marketplace`
- `#/v/2011-06-01-social-travel`
- `#/v/2014-07-16-belo`
- `#/v/2016-11-17-trips`
- `#/v/2018-02-22-plus`
- `#/v/2020-05-01-online-experiences`
- `#/v/2022-05-11-categories`
- `#/v/2023-05-03-rooms`
- `#/v/2025-06-01-services-experiences`
- `#/v/2026-05-01-services-era`

Recommendation: make `#/` redirect/render the newest implemented route, currently `#/v/2026-05-01-services-era`. Keep optional aliases short only if needed, e.g. `#/2025` and `#/2026`, but display and data keys should use the canonical date-first slugs above.

## Shared 2025/2026 Services-Era Shell

- Layout: white, airy Airbnb desktop shell; full-width sticky top area with logo at left, centered product tabs, account/host controls at right, large rounded search control below/within header, then a listing/inspiration content area.
- Palette: white `#fff`, near-black `#222222`, muted gray `#6A6A6A`/`#717171`, hairline `#DDDDDD`, soft background `#F7F7F7`, Airbnb red/pink `#FF385C` with older mask/logo red near `#FF5A5F`.
- Typography feel: Airbnb Cereal-style rounded sans; tight, high-weight labels for nav/search, restrained 14-16px body, no oversized marketing hero headline on these captures.
- Visual language: product tabs have small colorful image icons above/next to labels; `Experiences` and `Services` carry hidden/assistive "new" text in the archive and should get a small red dot or "NEW" pill if the UI wants a visible cue.
- Header right: `Become a host`, globe/language icon, profile menu with hamburger + user circle. In 2025/2026 footer era, host menu also exposes hosting for homes, experiences, and services.
- Footer: gray/white footer with `Support`, `Hosting`, and `Airbnb` columns; include `Help Center`, `AirCover`, `Anti-discrimination`, `Disability support`, `Cancellation options`, `Report neighborhood concern`; hosting links include `Airbnb your home`, `Airbnb your experience`, and, for the Services-era, `Airbnb your service`; bottom row has copyright, `Privacy`, `Terms`, language/currency, and social icons.

## 2025-06-01: Homes / Experiences / Services

Route: `#/v/2025-06-01-services-experiences`

- Capture basis: Wayback `20250601000554` for `https://www.airbnb.com/`; use as canonical June 1 capture.
- Main copy/source positioning: this page is the public homepage shortly after the May 13, 2025 Summer Release: "Now you can Airbnb more than an Airbnb." Airbnb positioned the release as Services, Experiences, and an all-new app for booking homes, services, and experiences in one place.
- Top-level tabs: `Homes` active, `Experiences` new, `Services` new. Link targets were `/`, `/experiences`, `/services`.
- Search fields:
  - Homes/stays: `Where` with placeholder `Search destinations`, `Check in`/`Check out` with `Add dates`, `Who` with `Add guests`; date panel copy `When's your trip?`.
  - Experiences: `Where to?`, `When's your trip?`, `Who's coming?`, action `Search`/step `Next`.
  - Services: service type picker with `Photography`, `Chefs`, `Prepared meals`, `Massage`, `Training`, `Makeup`, `Hair`, `Spa treatments`, `Catering`, `Nails`; location still uses `Search destinations`; action `Search`.
- Content layout: no giant hero; after the header/search, show horizontally-scrollable/sectioned listing shelves. Archive section titles include `Popular homes in Paris`, `Available in Berlin next weekend`, `Stay in Vienna`, `Available in Prague next weekend`, `Homes in London`, then `Inspiration for future getaways`.
- Cards: modern Airbnb listing cards with large rounded-corner image, heart/save control in the image corner, concise title/location, rating/price metadata. Use European city examples to match the capture.
- Distinctive 2025 details: release-new feel; services are new hotel-like add-ons. Service cards should emphasize professionals and instant booking, with price badges such as "from $50" where useful. Experiences should feel local/social, e.g. pastry, landmarks, food tours.

## 2026-05-01: Newest Pre-Release Services-Era Capture

Route: `#/v/2026-05-01-services-era`

- Capture basis: Wayback `20260501141757` or `20260501145906` for `https://www.airbnb.com/`; use May 1 capture, before Airbnb's May 20, 2026 Summer Release introduced/announced the later `All` homepage.
- Main copy/source positioning: still the Services-era public homepage: Airbnb's product surface supports homes, experiences, and services, but the later 2026 `All` tab/new homepage should not be used for this May 1 page.
- Top-level tabs: keep `Homes`, `Experiences`, `Services`; do not add `All` here. `Homes` remains active on root. `Experiences` and `Services` remain visually new/promoted.
- Search fields:
  - Homes/stays: `Where` / `Search destinations`, `Check in` / `Add dates`, `Check out` / `Add dates`, `Who` / `Add guests`.
  - Experiences: location placeholder includes `Search by city or landmark` in the May 1 capture; use this as the key differentiator from 2025. Dates include quick picks like `Today`, `Tomorrow`, `This weekend`.
  - Services: service type picker has `Photography`, `Chefs`, `Massage`, `Prepared meals`, `Training`, `Makeup`, `Hair`, `Spa treatments`, `Catering`. The archive did not surface `Nails` in the same extracted list for this capture, so omit or de-emphasize it for 2026-05-01.
- Content layout: more generic, mature homepage shelf. The extracted capture emphasizes `Inspiration for future getaways` with tabs such as `Popular`, `Kid-friendly state parks`, and `Airbnb-friendly apartments`; use a dense destination-link grid after the main listing area.
- Cards/details: same modern rounded listing cards, but use US/global destination inspiration names from the capture: Barcelona, St. Petersburg, Cleveland, Madrid, Dallas, Brooklyn, Memphis, San Juan, Savannah, Manhattan, Kansas City, Gulf Shores, Washington, Philadelphia, Orange Beach, San Diego, Maui, Nashville, Milan, Tokyo, New York, Los Angeles, Orlando.
- Distinctive 2026-05-01 details: visually similar to 2025 but less launch-y; make it feel like Services/Experiences have settled into the main product. Avoid adding post-May-20 features such as `All`, grocery delivery, airport pickups, luggage storage, car rentals, boutique hotels, AI review highlights, or FIFA World Cup Experiences on this specific route.

## Source Anchors

- 2025 official release: https://news.airbnb.com/airbnb-2025-summer-release/
- 2026 official release, useful only to distinguish what comes after May 1: https://news.airbnb.com/airbnb-2026-summer-release/
- 2025 Wayback capture: https://web.archive.org/web/20250601000554/https://www.airbnb.com/
- 2026 Wayback capture: https://web.archive.org/web/20260501141757/https://www.airbnb.com/
