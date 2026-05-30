# Modern Airbnb Homepage Implementation Spec

Scope: research/design notes only for the modern routes. Do not edit shared app files from this note.

Shared modern treatment:
- Typography: Airbnb Cereal feel via `Inter`, `Arial`, or system sans. Heavy rounded display type for hero copy, 12-14px semibold labels in search/category UI, roomy line height.
- Core palette: Airbnb red `#ff385c`, near-black `#222222`, white `#ffffff`, light gray `#f7f7f7`, border gray `#dddddd`, muted text `#717171`.
- Common chrome: left Airbnb wordmark/mark, centered primary nav or search pill, right host CTA, globe, rounded menu/avatar pill. Use line icons for category/search UI.

## `/2020-05-01` - COVID Pivot: Monthly Stays + Online Experiences

Layout:
- First screen should feel like a crisis-response product hub, not vacation escapism. Use a clean white page with a top header/search area and a three-card product row.
- Add a thin black announcement bar at the top: "Get the latest on our COVID-19 response".
- Header: Airbnb logo left; nav tabs `Places to stay`, `Monthly stays`, `Experiences`, `Online Experiences` with a small `NEW` badge on Online Experiences; right side `Become a host`, globe, menu/avatar.
- Search is a wide rounded rectangle under tabs. Fields: `Location` / `Add city, landmark, or address`, `Check in / Check out` / `Add dates`, `Guests` / `Add guests`, red rectangular or circular `Search` button.

Main copy:
- Hero headline: "We may be apart but we'll get through this together."
- Three feature cards:
  - `Online Experiences` - "Enjoy interactive video sessions with hosts around the world."
  - `Monthly stays` - "Feel at home, wherever you stay for a month or longer."
  - `Frontline stays` - "Find or provide places to stay for COVID-19 responders."

Palette and typography feel:
- Mostly white and soft gray, red used only for logo, active nav underline, NEW badge, and search button.
- Copy should be empathetic and direct. Avoid huge vacation-style display copy.

Distinctive details:
- Card images should read as video call/at-home activity, remote-work apartment, and medical/frontline support.
- Monthly tab can show a subtle helper state: `28-night minimum` and "Planning a shorter stay? Switch to Places to stay."
- Footer columns should include era-specific links: `Our COVID-19 Response`, `Cancellation options`, `Frontline Stays`, `Host an Online Experience`, `Host an Experience`.

## `/2021-12-01` - Flexible Travel: "I'm flexible"

Layout:
- Full-bleed illustrated nature/forest hero with dark green edges and a bright center glow.
- Transparent or black-on-hero header. Center nav: `Places to stay`, `Experiences`, `Online Experiences`; right side `Switch to hosting`, globe, menu/avatar.
- A large floating white search pill sits near the top of the hero. Fields: `Location` / `Where are you going?`, `Check in` / `Add dates`, `Check out` / `Add dates`, `Guests` / `Add guests`, circular red search button.
- Center of hero: small bold line "Not sure where to go? Perfect." and oversized white pill CTA `I'm flexible` in magenta/purple text.

Main copy:
- Primary: "Not sure where to go? Perfect."
- CTA: "I'm flexible"
- Optional below-fold sections, if needed for scroll depth: `Explore nearby`, `Live anywhere`, `Experience the world`, `Inspiration for future getaways`.

Palette and typography feel:
- Hero: deep forest green, black overlay, warm sunlight, white text.
- CTA text can use a purple-magenta gradient feel, but keep the button itself white with a soft shadow.
- Search labels are compact semibold; values are lighter gray.

Distinctive details:
- The central `I'm flexible` CTA is the visual protagonist; property cards are secondary.
- If implementing a date popover, use `Calendar | I'm flexible` segmented control, trip length chips `Weekend`, `Week`, `Month`, and month tiles such as `March`, `April`, `May`, `June`.
- The flexible search story should point users toward unique stays and broad discovery, not a specific destination.

## `/2022-05-14` - Categories Redesign

Layout:
- No hero. The homepage becomes a marketplace grid immediately.
- Header on white: Airbnb logo left; compact centered search pill with `Anywhere`, `Any week`, `Add guests`, red circular search icon; right side `Airbnb your home`, globe, menu/avatar.
- Under the header, add a horizontal category rail with line icons and labels. Suggested first visible categories: `Design`, `Camping`, `Surfing`, `National parks`, `Desert`, `Lakefront`, `Treehouses`, `OMG!`; active category has black text and underline.
- Right side of category rail: round next arrow and `Filters` pill with sliders icon.
- Main content: 4-column listing grid on desktop, 2-column tablet, 1-column mobile. Cards have large rounded photos, heart icon, carousel dots, location, short category-relevant descriptor, dates, price/night, rating.
- Add a floating bottom-center `Show map` pill.

Main copy:
- UI copy is mostly functional. Use listing snippets like `Designed by Frank Lloyd Wright`, `Jul 6-13`, `$569 night`, rating `4.91`.
- For an optional release promo strip: `Airbnb Categories` / `Discover homes you never knew existed.`

Palette and typography feel:
- White, black, gray, Airbnb red. The page should feel much quieter than 2021: product UI and photography carry the emotion.
- Category icons are thin black/gray strokes, labels 12px, active underline 2px black.

Distinctive details:
- Categories are the defining feature: icon rail above content, active category driving every photo/card.
- Use visually obvious photos for each category. For `Design`, show iconic architecture/interiors; for `OMG!`, use unusual homes; for `Lakefront`, show water.
- Optional Split Stays module for longer searches: paired cards with copy like `Split your time between...` and an animated/curved connector on a map.
- Avoid the later 2022 Winter Release banner for this May route.

## `/2023-12-31` - Rooms + Trust Signals

Layout:
- Listing-grid homepage, similar to 2022, but denser and more trust/price oriented.
- Header: Airbnb logo left; centered nav `Stays`, `Experiences`, `Online Experiences`; search pill with `Where` / `Search destinations`, `Dates` / `Add dates`, `Who` / `Add guests`; right side `Airbnb your home`, globe, menu/avatar.
- Category rail should include `Rooms` and make it active for this route. Also include current-feeling categories such as `Amazing views`, `Beach`, `Cabins`, `Countryside`, `Tiny homes`, `Castles`, `OMG!`, `Mansions`, plus `Filters`.
- Add a right-aligned toggle pill: `Display total before taxes`.
- Main grid: 5 columns on wide desktop if space allows, otherwise 4. Many cards should show `Guest favorite` badges. Card metadata should lean room-specific: `Stay with Ana`, `Hosted by...`, `Private room`, `Shared bathroom`/`Private bathroom`, `Bedroom lock`, rating, price.

Main copy:
- Primary route label can be invisible in UI; the active category `Rooms` should communicate the page.
- Optional small intro panel: `Airbnb Rooms` / `Stay with a local host`.
- Room card details: `Stay with Werner`, `Superhost`, `7 years hosting`, `Bedroom door locks`, `Private attached bathroom`.

Palette and typography feel:
- Same white marketplace shell, but more badges and toggles than 2022.
- `Guest favorite` badges are white pills with dark text over image corners.
- Host Passport elements can use warm off-white cards, circular host photos, and compact stats.

Distinctive details:
- Include a Host Passport teaser on at least one room card or side module: host photo, name, Superhost/rating/reviews/years hosting, and 2-3 fun facts.
- Add privacy filter chips or a mini filter drawer: `Bedroom door lock`, `Private bathroom`, `Shared bathroom`, `Who else is home`.
- Since this date is after the 2023 Winter Release, sprinkle `Guest favorite` labels across high-rated cards and keep total-price display visible.
- Footer should use the modern `Inspiration for future getaways` section with tabs/city links, then standard support/hosting/company columns.

## Source Anchors

- 2020 Online Experiences launch: https://www.prnewswire.com/news-releases/enjoy-the-magic-of-airbnb-experiences-from-the-comfort-of-your-home-301037974.html
- 2020 monthly/longer-stay pivot: https://techcrunch.com/2020/04/08/airbnb-rolls-out-new-features-aimed-at-its-next-big-bet-longer-term-stays/
- 2020 homepage tabs/monthly screenshots: https://www.rentalscaleup.com/airbnb-monthly-stays-rentals/
- 2020 COVID homepage screenshot with three cards: https://www.ipsos.com/sites/default/files/ct/news/documents/2020-05/italia_ai_tempi_del_coronavirus_strumenti_digitali.pdf
- 2021 Flexible Search official post: https://news.airbnb.com/en-uk/new-flexible-search-gives-guests-more-ability-to-fit-travel-into-life/
- 2021 Summer Release official page: https://news.airbnb.com/product-releases/airbnb-2021-summer-release/
- 2021 `I'm flexible` homepage screenshots: https://www.rentalscaleup.com/airbnb-flexible-destinations-dates-matching/
- 2022 Summer Release official page: https://news.airbnb.com/product-releases/airbnb-2022-summer-release/
- 2022 Summer Release media guide: https://news.airbnb.com/wp-content/uploads/sites/4/2022/05/Airbnb-Summer-Release-Media-Guide-1.pdf
- 2023 Summer Release official page: https://news.airbnb.com/2023-summer-release/
- 2023 Winter Release / Guest Favorites: https://news.airbnb.com/product-releases/airbnb-2023-winter-release/
- Visual archive references: https://www.webdesignmuseum.org/gallery/airbnb-2021, https://www.webdesignmuseum.org/gallery/airbnb-in-2022, https://www.webdesignmuseum.org/gallery/airbnb-in-2023
