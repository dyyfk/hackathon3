# Early Airbnb Homepage Clone Spec

Scope: research/design notes only for early historical versions. Do not edit app files from this pass.

Suggested routes:
- `/2009-02-04-airbed`
- `/2010-01-02-airbnb`
- `/2012-01-01-airbnb`
- `/2012-07-03-wishlists`
- Optional late-2012 companion route: `/2012-11-14-neighborhoods`

Archive caveat: I did not find an exact 2009-02-04 root capture. The nearest usable root capture is 2009-01-22, with Jan. 31 query captures showing Feb. search dates, so treat 2009-02-04 as a faithful nearby-state reconstruction.

## 2009-02-04 - AirBed & Breakfast

Source feel: small, utility-heavy, pre-Airbnb naming, map/listing discovery more than polished brand.

Layout:
- Narrow centered page with a simple top header.
- Header left: text logo/headline `AirBed & Breakfast - Forget hotels.`
- Header right: `Sign Up`, `Sign In`, and a graphic-style `Post a room` button.
- Main content starts with centered headline and coverage line.
- Search is a horizontal row above a large map area.
- Below/alongside the map: a rotating listing bubble and four small promo tiles.
- Footer is a single-line utility/social bookmark bar.

Palette:
- Mostly white and pale blue/sky-blue UI, gray borders, link blue, orange/yellow image-style search/post buttons.
- Keep it older-web: visible borders, small shadows only if they look image-button-like.

Typography feel:
- Default system sans, old XHTML-era sizing, compact leading.
- H2 is plain bold sans, not brand-serif or modern display.

Main copy:
- Title/meta: `AirBed & Breakfast: Better Than a Cheap Hotel`
- Header: `AirBed & Breakfast - Forget hotels.`
- Headline: `Stay with a local when traveling`
- Coverage: `You can stay in 685 cities in 71 countries.`

Search fields:
- Location text input value: `Where are you going?`
- Check in: `mm/dd/yyyy`
- Check out: `mm/dd/yyyy`
- Guests select: `1`, `2`, `3+`
- Submit as image-like `Search` button.

Footer/navigation:
- Top: `Sign Up`, `Sign In`, `Post a room`
- Footer: `About`, `FAQ`, `Contact`, `Terms & Privacy`, `Socially bookmark us:`, tiny Facebook/FriendFeed/Delicious/StumbleUpon-style icons, copyright `AirBed & Breakfast, Inc.`

Distinctive visual details:
- Google-map style panel with random listing marker/bubble.
- Listing bubble: 180px profile photo, 43px room thumbnail, price like `$50 per night`, quoted listing name, `See listing`.
- Four 245x188 promo image slots: inauguration housing, NYC, Aspen, Greece.
- Old image-button hover states for `Post a room` and `Search`.
- Small archive-style notice bar can appear above content, but keep it subtle.

## 2010-01-02 - Airbnb, "Travel like a human."

Source feel: renamed Airbnb, still compact, but warmer and more brand-aware.

Layout:
- Centered fixed-width page.
- Header: Airbnb logo/title at left, tagline directly underneath; utility links at right.
- Main is split: left search block, right/nearby featured listing slideshow with large photo and host avatar.
- Search area is more prominent than 2009 but still form-first.
- Footer remains compact link rows.

Palette:
- White and light gray base, black/dark gray text.
- Accent colors from CSS era: green buttons (`#4aa400`, `#5ccd00`), bright cyan/blue (`#009FEF`), magenta/pink (`#E0007A`), small yellow/coral accents.

Typography feel:
- Clean Helvetica/Arial web sans.
- Logo/tagline has friendly startup tone; avoid modern Airbnb Cereal styling.

Main copy:
- Header/title: `Airbnb - Travel like a human.`
- Tagline: `Travel like a human.`
- Headline: `Find a place to stay.`
- Coverage: `Rent nightly from real people in 2089 cities in 106 countries.`
- Example listing: `"Casa Ponte I" - Puntarenas`, `$1500 / night`

Search fields:
- Location: `Where are you going?`
- Button: `Search`
- Check in: `mm/dd/yyyy`
- Check out: `mm/dd/yyyy`
- Guests: `1`, `2`, `3+`

Footer/navigation:
- Top: `Sign Up`, `Sign In`, `Post a room`
- Footer: `About`, `Blog`, `Help`, `Contact`, `Terms & Privacy`
- Deals row: `Best Deals: New York, San Francisco, Paris, Vancouver Olympics Rentals`
- Social: `Twitter`, `Facebook`
- Language examples: `English`, `Francais`

Distinctive visual details:
- Large framed slideshow image around 465x310, with host avatar and listing text underneath.
- Tiny previous/pause/next slideshow control strip.
- Glossy/bubble `Post a room` button.
- Search button as a colored block attached to the location input.
- Footer feels like a Craigslist-era link cluster, not a modern sitemap.

## 2012-01-01 - Mature Global Marketplace

Source feel: established global marketplace, internationalized, search plus curated inventory.

Layout:
- Full-width top bar with Airbnb logo, `How It Works`, auth links, `List your space`, `Help`, locale/currency selector.
- Main content is a two-column hero: left search panel, right featured-listing slideshow.
- Below hero: host-value banner, tabbed area for `What's New` and `Popular Cities`, then press strip.
- Footer expands into a broader global marketplace sitemap.

Palette:
- White/gray chrome, dark gray text, glossy gradients.
- Bright blue links/buttons, pink call-to-action accent, green secondary accents, subtle shadows.

Typography feel:
- Mix of clean sans, Museo-like rounded headings, and SignPainter-style script for promotional modules.
- More polished than 2010 but still skeuomorphic/glossy.

Main copy:
- Headline: `Find a place to stay.`
- Coverage: `Rent from real people in 19,732 cities in 192 countries.`
- Error helper: `Please set location`
- Host banner: `How much is your place worth?` and `Calculate now >>`
- Tabs/cards: `What's New`, `Popular Cities`, `Why Conan became an Airbnb host`, `Trust & Safety Center`, `Airbnb Sublets`, `Monthly stays made easy`

Search fields:
- Location placeholder: `Where are you going?`
- Button: `Search`
- Check in: `mm/dd/yy`
- Check out: `mm/dd/yy`
- Guests: `1` through `16+`

Footer/navigation:
- Top/nav: `How It Works`, `Sign Up`, `Log In`, `List your space`, `Help`, `$ USD`, language/currency dropdown.
- Footer: `Collections`, `iPhone App`, `Airbnb TV`, `About`, `Safety`, `Contact`, `Jobs`, `Blog`, `Help`, `Terms & Privacy`
- Deals/social: `Best Deals: New York, San Francisco, Paris`, `Top Cities`, `Twitter`, `Facebook`, `YouTube`
- Include phone/corporate line: `Airbnb, Inc., Airbnb UK Limited +1-855-424-7262`

Distinctive visual details:
- Right-side slideshow card with rounded photo top, rounded details bottom, circular/rounded host avatar.
- Speech-bubble tail in listing details.
- Glossy `Search` and pink `Calculate now >>` buttons.
- `What's New`/`Popular Cities` tab strip with rounded tab container.
- Dense city list grouped by continent/country.

## 2012-07-03 - Discovery/Wish Lists Redesign

Source feel: major visual shift from search utility to image-led discovery and social saving.

Layout:
- Top bar: Airbnb logo, `How It Works`, auth, `Wish Lists`, support/help, language/currency, `List your space`.
- Above fold: full-bleed 1600x700 hero slideshow of listings with caption card anchored near lower left.
- Overlay/intro area: `Wish Lists` badge, video thumbnail, lede, `Watch the video`.
- Search area follows on a light/white band with a decorative blob behind it.
- Discovery tabs below: `Popular`, `Friends`, `Airbnb Picks`, `My Wish Lists`.
- Feed/cards feature named collections; first visible collection is `Green Getaways`.

Palette:
- Photo-dominant.
- White/black UI, gray chrome, cyan-blue links (`#25a8e3`, `#188bc1`), magenta/pink accents (`#ed1d89`, `#bf0265`), green highlights.

Typography feel:
- Modernized sans plus Museo/SignPainter accents.
- Larger hero/search type; more editorial than the 2012-01 marketplace.

Main copy:
- Lede: `Discover, save, and share your favorite places on Airbnb.`
- Link: `Watch the video`
- Search headline: `Find a place to stay.`
- Coverage: `Rent from people in 25,812 cities and 192 countries.`
- Example hero captions: `Cosy Apartment - Copenhagen, Denmark - $75`; `Stunning Room in Clapham Common - London, United Kingdom - $96`
- Collection/tab copy: `Popular`, `Friends`, `Airbnb Picks`, `My Wish Lists`, `Green Getaways`

Search fields:
- Location placeholder: `Where do you want to go?`
- Check in placeholder: `Check in`
- Check out placeholder: `Check out`
- Guests: placeholder `Guests`, then `1` through `8+`
- Button: `Search`

Footer/navigation:
- Top/nav: `How It Works`, `Sign Up`, `Log In`, `0 Wish Lists`, `24/7 Support`, `English`, `USD`, `List your space`
- Footer groups: `Explore`, `Collections`, `Mobile`, `Airbnb TV`, `Safety`, `Best deals`, `Company`, `Jobs`, `Blog`, `Help`, `Terms & Privacy`, `Join us on Twitter/Facebook/Google/YouTube`

Distinctive visual details:
- Full-bleed listing photo slideshow with small thumbnail/price caption.
- Big illustrated `Wish Lists` introduction badge plus video thumbnail.
- Soft oval/blob image behind the search headline.
- Icon tabs for Popular/Friends/Airbnb Picks/My Wish Lists.
- Card/grid discovery feed with collection names like `Airbnb Top 40`, `Airstreams`, `Playful Stays`, `Paleo Properties`.

## 2012-11/12 - Neighborhoods Companion State

Use this if the app splits late 2012 into a second URL; otherwise fold the hero/details into the 2012-07 route as a "late 2012" section.

Layout:
- Top header includes compact search settings before the hero.
- Header search settings expose date, guests, room type checkboxes, and `Find a place`.
- Browse dropdown includes `Popular`, `Airbnb Picks`, `Match`.
- Main hero is a launch splash: `Introducing` + giant `Neighborhoods`, with `Watch the Video` and `Watch the Event`.
- Center carousel/list of neighborhood names and cities.
- Below hero, three equal columns: `Travel`, `Host`, `How it Works`.

Palette:
- Black/white photo-led background with blue accents, pink/magenta highlights, gray utility chrome.
- More dramatic contrast than July.

Typography feel:
- `Introducing` in script/signpainter style.
- `Neighborhoods` and neighborhood names in tall condensed League Gothic style.

Main copy:
- Hero: `Introducing` / `Neighborhoods`
- CTAs: `Watch the Video`, `Watch the Event`
- Neighborhood examples: `Ipanema, Rio de Janeiro`; `DUMBO, New York`; `Mission District, San Francisco`; `Covent Garden, London`; `Schoneberg, Berlin`; `Port-Royal, Paris`; `Georgetown, Washington DC`
- Band copy: `Rent unique spaces from people all around the world.` and `Learn More`
- Columns:
  - `Travel`: `From apartments and rooms to treehouses and boats: stay in unique spaces in 192 countries.`
  - `Host`: `Renting out your unused space could pay your bills or fund your next vacation.`
  - `How it Works`: `From our worldwide customer support team to our unique review system, we've got your back.`

Search fields:
- Header search: location field, `Check in`, `Check out`, Guests `1` through `16`
- Room type checkboxes: `Entire home/apt`, `Private room`, `Shared room`
- Button: `Find a place`

Footer/navigation:
- Top/nav: `Browse`, `Popular`, `Airbnb Picks`, `Match`, `Help`, `List your space`, `Sign Up`, `Log In`, user dropdown, `Wish Lists`, `Inbox`
- Footer groups: `Discover`, `Safety`, `Airbnb Picks`, `Mobile`, `Airbnb TV`, `Life`, `How it works`, `Why Host`, `Social Connections`, `Company`, `About`, `Jobs`, `Press`, `Blog`, `Help`, `Policies`, `Terms & Privacy`, social links.

Distinctive visual details:
- Tall condensed `Neighborhoods` headline over a cinematic background.
- Animated-looking vertical or horizontal list of neighborhood/city pairs.
- Room type checkboxes in the header search drawer.
- Three-column explanatory band with script headings.
- `Watch the Video` / `Watch the Event` micro-links near the hero title.

## Sources

- 2009 nearest root capture: https://web.archive.org/web/20090122234547/http://airbedandbreakfast.com:80/
- 2010 capture: https://web.archive.org/web/20100102155706/http://www.airbnb.com:80/
- 2012-01 capture: https://web.archive.org/web/20120101183110/http://www.airbnb.com/
- 2012-07 capture: https://web.archive.org/web/20120703230406/https://www.airbnb.com/
- 2012-11 Neighborhoods capture: https://web.archive.org/web/20121114174158/https://www.airbnb.com/
- Wish Lists press release: https://assets.airbnb.com/press/press-releases/Airbnb%20Wish%20Lists%20Press%20Release.pdf
- Neighborhoods launch coverage: https://techcrunch.com/2012/11/13/airbnb-launches-neighborhoods-providing-the-definitive-travel-guide-for-its-guests/
