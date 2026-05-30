# MID Airbnb Homepage Clone Specs

Bounded scope: research/design notes only for the mid-era versions. Do not implement from this file by editing shared app files unless assigned separately.

## Shared MID Implementation Notes

- Suggested routes: `/2014-07-17`, `/2016-11-17`, `/2017-01-01`, `/2019-06-01`.
- Brand constants across all four: Airbnb coral `#ff5a5f`, dark gray `#484848`, muted gray `#767676`, light border `#dce0e0`, white surfaces, rounded controls at 4px in older versions and pill/large-radius accents only for the 2017 Trips cards.
- Typography feel: use system fallback close to Circular, e.g. `"Helvetica Neue", Arial, sans-serif`; 2017 and 2019 should feel heavier and more modern, with bolder headings and tighter spacing.
- Logo treatment: approximate with a text Airbnb mark plus small Belo glyph/icon shape. Do not depend on external brand assets.

## 2014-07-17 - Belong Anywhere / Belo Rebrand

- Layout: full-viewport cinematic hero with dark overlay, top transparent header, white logo left, nav right. Hero text centered vertically. Search bar sits docked near the bottom of hero as a horizontal strip.
- Main copy: H1 `Welcome home`; subcopy `Rent unique places to stay from local hosts in 190 countries`.
- Search fields: destination placeholder `Where do you want to go?`, date fields `Check In` and `Check Out`, guests select 1 to 16+, coral `Search` button.
- Nav: header-location quick search in nav can be omitted on the landing route, but include `Neighborhoods`, `Help`, `Sign Up`, `Log In`. Include host CTA as `List Your Space` or `Become a Host` depending shared app conventions.
- Below hero: dark full-width band with "new Airbnb" story callout and a simple Belo animation/mark placeholder. Then a `Start Your Adventure` destination grid using large photo tiles, asymmetric first row, and white text overlays.
- Palette: coral `#ff5a5f`, white hero text, black overlay around 45%, dark charcoal section `#2b2d2e`, older Airbnb blue accent only if needed for small search/nav affordances.
- Distinctive details: people/lifestyle video feel rather than property-only imagery; top nav is airy and white-on-photo; the rebrand story band should make the Belo visible; older form controls are squared, dense, and utilitarian.

## 2016-11-17 - Live There / Trips Transition

- Layout: transitional homepage. Keep a conventional Airbnb homes search page as the main body, but add visible Trips-era navigation cues. Use a large white search card or horizontal search module over a light/photo hero rather than the 2017 launch carousel.
- Main copy direction: lead with `Live There` campaign energy in the hero or subhead. Supporting copy should emphasize living like a local, personalized neighborhoods, guidebooks, and host recommendations.
- Search fields: destination/search, check-in, checkout, guests, coral submit. Desktop can use a bordered table-like form with label row and large 19px values. Mobile uses one `Search` trigger.
- Nav: logo left; right nav should include `Trips`, `Become a Host`, `Help`, `Sign Up`, `Log In`. Add a small `Beta` badge near `Trips` or `City Hosts` to capture the launch transition.
- Below hero: three product teaser cards: `Homes`, `Experiences`, `Places`. Homes is still familiar listings; Experiences uses local experts; Places uses guidebooks/insider recommendations. Keep the cards restrained, because the full launch page is the 2017 route.
- Palette: white page, coral CTAs, teal focus accent `#008489`, gray labels, light border. Use warm neighborhood photography and local-life thumbnails.
- Distinctive details: this version should feel half old Airbnb booking engine and half new trip platform. The official Trips framing was Experiences, Places, and Homes, with future Flights/Services, so avoid making it look like a pure lodging-only page.

## 2017-01-01 - Trips Launch Page

- Layout: use the `/new` / Trips launch aesthetic, not a normal booking homepage. Full-bleed swipe/slide panels at about 550px desktop height, with oversized product art and text blocks. Make it feel like a product launch microsite.
- Main copy: H1 `Welcome to the world of trips.`; subcopy `Homes, experiences, and places - all in one app.`; CTA `See what's new`.
- Search fields: no primary booking search in the hero. If app shell requires a search affordance, keep only a compact nav search icon/input.
- Nav: white header with Airbnb mark, compact `Trips`, `Become a Host`, `Help`, `Sign Up`, `Log In`. Preserve a `Beta` badge in the Trips/account area if easy.
- Panels: first white/black text Trips panel; second red/coral radial panel for Experiences with phone/photo art; third peach radial panel for Places with insider/map/phone art; optional keynote/video tile with play button and dark gradient caption.
- Palette: white and charcoal for Trips; Experiences radial `#ff9077` to `#f63c46` to `#5c0030`; Places radial `#ffeec7` to `#ffd2c4` to `#ffa58c`; teal links `#008489`.
- Typography feel: heavier Circular-like headlines, 48px desktop / 32px mobile, 19px light captions, round outline CTAs with 64px radius.
- Distinctive details: product art should overlap panel edges, phone mockups should sit partly off-canvas, and cards should use minimal chrome. This route is about announcement, not conversion.

## 2019-06-01 - Places To Stay / Things To Do

- Layout: modern clean Airbnb homepage. White top nav, centered content width, large left-aligned booking module over/near a bright travel image or white hero region. First viewport should immediately show both lodging and activities intent.
- Main copy: H1 `Book unique places to stay and things to do.`
- Search fields: tab or segmented choice for `Places to stay` and `Things to do`; destination label `WHERE` with placeholder `Anywhere`; date fields `CHECK-IN` and `CHECKOUT`; `GUESTS` button/value; coral circular or rounded search button.
- Nav: Airbnb logo left, `Become a host`, `Help`, `Sign up`, `Log in` right. Keep nav text dark on white with generous spacing and no heavy borders.
- Below hero: rows/cards for places to stay, experiences/things to do, and destination suggestions. Use photo cards with small category labels, prices/ratings where useful, and more whitespace than 2014.
- Footer: modern multi-column footer with `Airbnb`, `Discover`, `Hosting`, `Support`, plus terms/privacy/currency/language row.
- Palette: white, dark gray `#222222`/`#484848`, coral `#ff385c` or `#ff5a5f`, gray labels, light dividers. 2019 is cleaner and less dark than 2014.
- Distinctive details: uppercase micro-labels in the search form, pill-ish date/guest controls, DLS/Cereal-like polish, and equal emphasis on stays plus experiences.

## Source Notes

- Wayback snapshots inspected via CDX/raw HTML:
  - 2014 homepage: `http://web.archive.org/web/20140717004925/https://www.airbnb.com/`
  - 2016 homepage: `http://web.archive.org/web/20161117164833/https://www.airbnb.com/`
  - 2016 Trips launch page: `http://web.archive.org/web/20161119023519/https://www.airbnb.com/new`
  - 2017 homepage: `http://web.archive.org/web/20170101104045/https://www.airbnb.com/`
  - 2019 homepage: `http://web.archive.org/web/20190601012946/https://www.airbnb.com/`
- Rebrand/art direction context: WIRED, "Why Airbnb's Redesign Is All About People, Not Places" - https://www.wired.com/2014/07/why-airbnbs-new-branding-strategy-is-all-about-people-not-places/
- Live There context: Airbnb Newsroom, "Airbnb Launches New Products to Inspire People to Live There" - https://news.airbnb.com/airbnb-launches-new-products-to-inspire-people-to-live-there/
- Trips launch context: PR Newswire, "Airbnb Expands Beyond the Home with the Launch of Trips" - https://www.prnewswire.com/news-releases/airbnb-expands-beyond-the-home-with-the-launch-of-trips-300365344.html
