const listings = [
  {
    id: "malibu-ocean-villa",
    category: "Beachfront",
    title: "Malibu Ocean Villa",
    location: "Malibu, California",
    style: "Glass walls, private stairs to the sand",
    rating: "4.92",
    reviews: 128,
    price: 420,
    host: "Lena",
    hostAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80",
    stats: ["6 guests", "3 bedrooms", "3 beds", "2 baths"],
    description:
      "A bright oceanfront villa with wide terraces, warm interiors, a chef's kitchen, and sunset views from nearly every room.",
    images: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82",
    ],
    features: [
      ["waves", "Steps from the beach"],
      ["chef-hat", "Chef-ready kitchen"],
      ["sunset", "Sunset terrace"],
      ["car", "Private parking"],
    ],
    amenities: [
      ["wifi", "Fast wifi"],
      ["waves", "Ocean view"],
      ["utensils", "Kitchen"],
      ["sparkles", "Pool"],
      ["washing-machine", "Laundry"],
      ["flame", "Fire pit"],
    ],
    reviewsText: [
      ["Noah", "The terrace felt made for slow mornings and golden-hour dinners."],
      ["Priya", "Every room is calm, sunny, and close enough to hear the water."],
    ],
  },
  {
    id: "tahoe-glass-cabin",
    category: "Cabins",
    title: "Tahoe Glass Cabin",
    location: "Lake Tahoe, California",
    style: "Pine forest, cedar sauna, quiet lake trail",
    rating: "4.86",
    reviews: 94,
    price: 280,
    host: "Miles",
    hostAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=80",
    stats: ["4 guests", "2 bedrooms", "2 beds", "1 bath"],
    description:
      "A compact mountain cabin wrapped in pine trees, with heated concrete floors, a reading loft, and a deck built for stargazing.",
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=900&q=82",
    ],
    features: [
      ["trees", "Wrapped in forest"],
      ["flame", "Cedar sauna"],
      ["book-open", "Reading loft"],
      ["mountain", "Lake trail nearby"],
    ],
    amenities: [
      ["wifi", "Wifi"],
      ["flame", "Indoor fireplace"],
      ["flame", "Sauna"],
      ["coffee", "Espresso setup"],
      ["car", "Driveway parking"],
      ["snowflake", "Radiant heat"],
    ],
    reviewsText: [
      ["Amelia", "Small, smart, and beautifully quiet after a day near the lake."],
      ["Theo", "The sauna and forest deck made the whole weekend feel restorative."],
    ],
  },
  {
    id: "kyoto-courtyard-loft",
    category: "Design",
    title: "Kyoto Courtyard Loft",
    location: "Kyoto, Japan",
    style: "Tatami lounge, sculptural bath, garden courtyard",
    rating: "4.95",
    reviews: 211,
    price: 190,
    host: "Aiko",
    hostAvatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=220&q=80",
    stats: ["3 guests", "1 bedroom", "2 beds", "1 bath"],
    description:
      "A serene loft tucked behind a narrow lane, pairing warm wood, handmade ceramics, and a private courtyard for tea.",
    images: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=82",
    ],
    features: [
      ["flower-2", "Private courtyard"],
      ["bath", "Deep soaking bath"],
      ["palette", "Handmade interiors"],
      ["map-pin", "Historic lanes"],
    ],
    amenities: [
      ["wifi", "Pocket wifi"],
      ["bath", "Soaking tub"],
      ["utensils", "Kitchenette"],
      ["leaf", "Garden view"],
      ["snowflake", "Air conditioning"],
      ["coffee", "Tea station"],
    ],
    reviewsText: [
      ["Mina", "A quiet, beautiful place to come home to after long city walks."],
      ["Daniel", "Every object felt chosen with care, and the courtyard was magic."],
    ],
  },
  {
    id: "sonoma-farmhouse",
    category: "Countryside",
    title: "Sonoma Olive Farmhouse",
    location: "Sonoma, California",
    style: "Olive grove, outdoor table, vineyard roads",
    rating: "4.89",
    reviews: 76,
    price: 310,
    host: "Claire",
    hostAvatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=220&q=80",
    stats: ["5 guests", "2 bedrooms", "3 beds", "2 baths"],
    description:
      "A sunlit farmhouse surrounded by olive trees, with a long outdoor table, a breezy kitchen, and quiet vineyard roads nearby.",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=82",
    ],
    features: [
      ["leaf", "Olive grove setting"],
      ["utensils", "Outdoor dining"],
      ["bike", "Quiet roads"],
      ["wine", "Near vineyards"],
    ],
    amenities: [
      ["wifi", "Wifi"],
      ["utensils", "Full kitchen"],
      ["washing-machine", "Laundry"],
      ["car", "Free parking"],
      ["sun", "Patio"],
      ["shield-check", "Self check-in"],
    ],
    reviewsText: [
      ["Jules", "The kitchen, patio, and grove made cooking together the whole point."],
      ["Sam", "Easy, warm, and peaceful without feeling remote."],
    ],
  },
  {
    id: "brooklyn-townhouse",
    category: "City",
    title: "Brooklyn Brownstone Suite",
    location: "Brooklyn, New York",
    style: "Tree-lined block, restored brick, record nook",
    rating: "4.81",
    reviews: 152,
    price: 225,
    host: "Iris",
    hostAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=220&q=80",
    stats: ["2 guests", "1 bedroom", "1 bed", "1 bath"],
    description:
      "A restored suite in a classic brownstone with exposed brick, generous windows, and an easy walk to cafes and trains.",
    images: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=900&q=82",
    ],
    features: [
      ["building-2", "Historic brownstone"],
      ["train", "Close to transit"],
      ["music", "Record nook"],
      ["coffee", "Cafe block"],
    ],
    amenities: [
      ["wifi", "Fast wifi"],
      ["snowflake", "Air conditioning"],
      ["coffee", "Coffee setup"],
      ["tv", "Streaming TV"],
      ["key-round", "Private entrance"],
      ["briefcase-business", "Work desk"],
    ],
    reviewsText: [
      ["Lara", "A calm room in the middle of everything we wanted to do."],
      ["Ben", "The brick, light, and records made it feel like a real neighborhood stay."],
    ],
  },
  {
    id: "sedona-desert-retreat",
    category: "Design",
    title: "Sedona Desert Retreat",
    location: "Sedona, Arizona",
    style: "Red rock views, clay walls, plunge pool",
    rating: "4.97",
    reviews: 63,
    price: 360,
    host: "Mara",
    hostAvatar:
      "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&w=220&q=80",
    stats: ["4 guests", "2 bedrooms", "2 beds", "2 baths"],
    description:
      "A low-slung desert home with soft plaster walls, a shaded courtyard, and wide red rock views from the plunge pool.",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82",
    ],
    features: [
      ["mountain", "Red rock views"],
      ["sparkles", "Plunge pool"],
      ["sun", "Shaded courtyard"],
      ["moon", "Dark sky nights"],
    ],
    amenities: [
      ["wifi", "Wifi"],
      ["sparkles", "Pool"],
      ["utensils", "Kitchen"],
      ["car", "Parking"],
      ["sun", "Outdoor shower"],
      ["thermometer-sun", "Climate control"],
    ],
    reviewsText: [
      ["Evan", "The pool and the view made the place feel cinematic."],
      ["Harper", "Beautifully designed but still comfortable after hiking."],
    ],
  },
];

const categories = [
  ["All", "layout-grid"],
  ["Beachfront", "waves"],
  ["Cabins", "trees"],
  ["City", "building-2"],
  ["Countryside", "leaf"],
  ["Design", "palette"],
];

let activeCategory = "All";
let selectedListing = null;

const app = document.querySelector("#app");

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function icon(name, className = "") {
  return `<i data-lucide="${name}" class="${className}" aria-hidden="true"></i>`;
}

function renderShell(content) {
  app.innerHTML = `
    <div class="app-shell">
      <header class="site-header">
        <div class="header-inner">
          <button class="brand icon-button" type="button" data-action="home" aria-label="Show homes">
            <span class="brand-mark">${icon("home", "header-icon")}</span>
            <span class="brand-label">StayFinder</span>
          </button>
          <nav class="nav-actions" aria-label="Primary">
            <button class="text-button" type="button">Wishlist</button>
            <button class="text-button" type="button">Trips</button>
            <button class="profile-button icon-button" type="button" aria-label="Open profile menu">
              ${icon("menu", "header-icon")}
              ${icon("circle-user-round", "header-icon")}
            </button>
          </nav>
        </div>
      </header>
      <main>${content}</main>
    </div>
  `;

  attachEvents();
  refreshIcons();
}

function renderBrowse() {
  selectedListing = null;
  const filtered =
    activeCategory === "All"
      ? listings
      : listings.filter((listing) => listing.category === activeCategory);

  renderShell(`
    <section class="browse-view" aria-label="Homes">
      <div class="category-bar" role="tablist" aria-label="Stay categories">
        ${categories
          .map(
            ([label, iconName]) => `
              <button
                class="category-tab ${activeCategory === label ? "active" : ""}"
                type="button"
                role="tab"
                aria-selected="${activeCategory === label}"
                data-category="${label}"
              >
                ${icon(iconName)}
                <span>${label}</span>
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="view-heading">
        <div>
          <h1>Homes with character, ready to explore.</h1>
          <p>Standout places shaped by setting, style, and mood, from quiet cabins to oceanfront villas.</p>
        </div>
      </div>

      <div class="listing-grid">
        ${filtered.map(renderListingCard).join("")}
      </div>
    </section>
  `);
}

function renderListingCard(listing) {
  return `
    <button class="listing-card" type="button" data-listing="${listing.id}" aria-label="View details for ${listing.title}">
      <span class="listing-media">
        <img src="${listing.images[0]}" alt="${listing.title}" loading="lazy" />
        <span class="favorite-dot">${icon("heart")}</span>
      </span>
      <span class="listing-body">
        <span>
          <h2 class="listing-title">${listing.title}</h2>
          <p class="listing-meta">${listing.location}</p>
          <p class="listing-style">${listing.style}</p>
        </span>
        <span class="listing-rating">${icon("star")} ${listing.rating}</span>
        <span class="listing-price"><strong>${money(listing.price)}</strong> night</span>
      </span>
    </button>
  `;
}

function renderDetail(id) {
  selectedListing = listings.find((listing) => listing.id === id) || listings[0];

  renderShell(`
    <section class="detail-view" aria-label="${selectedListing.title} details">
      <div class="detail-topbar">
        <button class="back-button" type="button" data-action="back">
          ${icon("chevron-left")}
          <span>Homes</span>
        </button>
        <div class="utility-actions">
          <button class="utility-button" type="button" aria-label="Share this home">${icon("share")}</button>
          <button class="utility-button" type="button" aria-label="Save this home">${icon("heart")}</button>
        </div>
      </div>

      <div class="detail-title-row">
        <div>
          <h1>${selectedListing.title}</h1>
          <div class="detail-subline">
            <span>${selectedListing.location}</span>
            <span class="dot-separator"></span>
            <span>${icon("star")} ${selectedListing.rating}</span>
            <span class="dot-separator"></span>
            <span>${selectedListing.reviews} reviews</span>
          </div>
        </div>
        <div class="detail-price"><strong>${money(selectedListing.price)}</strong> / night</div>
      </div>

      <div class="gallery-grid">
        ${selectedListing.images
          .map(
            (image, index) => `
              <div class="gallery-image">
                <img src="${image}" alt="${selectedListing.title} photo ${index + 1}" />
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="detail-content">
        <div>
          <section class="section">
            <div class="host-row">
              <img class="host-avatar" src="${selectedListing.hostAvatar}" alt="${selectedListing.host}" />
              <div>
                <h2>Entire place hosted by ${selectedListing.host}</h2>
                <p>${selectedListing.stats.join(" · ")}</p>
              </div>
            </div>
          </section>

          <section class="section">
            <h2>What makes it special</h2>
            <ul class="feature-list">
              ${selectedListing.features
                .map(([iconName, label]) => `<li class="feature-item">${icon(iconName)}<span>${label}</span></li>`)
                .join("")}
            </ul>
          </section>

          <section class="section">
            <h2>About this place</h2>
            <p>${selectedListing.description}</p>
          </section>

          <section class="section">
            <h2>Amenities</h2>
            <ul class="amenity-list">
              ${selectedListing.amenities
                .map(([iconName, label]) => `<li class="amenity-item">${icon(iconName)}<span>${label}</span></li>`)
                .join("")}
            </ul>
          </section>

          <section class="section reviews">
            <h2>Guest notes</h2>
            <div class="review-grid">
              ${selectedListing.reviewsText
                .map(
                  ([name, text]) => `
                    <article class="review-card">
                      <strong>${name}</strong>
                      <p>${text}</p>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        </div>

        <aside class="booking-panel" aria-label="Booking summary">
          <h2>${selectedListing.title}</h2>
          <p class="panel-price"><strong>${money(selectedListing.price)}</strong> / night</p>
          <ul class="panel-facts">
            <li><span>Rating</span><strong>${selectedListing.rating}</strong></li>
            <li><span>Reviews</span><strong>${selectedListing.reviews}</strong></li>
            <li><span>Style</span><strong>${selectedListing.category}</strong></li>
          </ul>
          <button class="primary-button" type="button">${icon("send")} Request to book</button>
          <button class="secondary-button" type="button">${icon("message-circle")} Contact host</button>
          <p class="panel-note">A host confirmation follows each request.</p>
        </aside>
      </div>
    </section>

    <div class="mobile-bottom-bar">
      <div>
        <strong>${money(selectedListing.price)}</strong> / night
        <div>${icon("star")} ${selectedListing.rating} · ${selectedListing.reviews} reviews</div>
      </div>
      <button class="primary-button" type="button">${icon("send")} Request</button>
    </div>
  `);
}

function attachEvents() {
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderBrowse();
    });
  });

  document.querySelectorAll("[data-listing]").forEach((button) => {
    button.addEventListener("click", () => {
      renderDetail(button.dataset.listing);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-action='back'], [data-action='home']").forEach((button) => {
    button.addEventListener("click", () => {
      renderBrowse();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

renderBrowse();
