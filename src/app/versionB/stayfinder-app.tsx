"use client";

/* eslint-disable @next/next/no-img-element */
import {
  Bath,
  Bike,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Car,
  ChefHat,
  ChevronLeft,
  Circle,
  CircleUserRound,
  Coffee,
  Flame,
  Flower2,
  Heart,
  Home,
  KeyRound,
  LayoutGrid,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Mountain,
  Music,
  Palette,
  Send,
  Share,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Sunset,
  ThermometerSun,
  Train,
  Trees,
  Tv,
  Utensils,
  WashingMachine,
  Waves,
  Wifi,
  Wine,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type Listing = {
  id: string;
  category: string;
  title: string;
  location: string;
  style: string;
  rating: string;
  reviews: number;
  price: number;
  host: string;
  hostAvatar: string;
  stats: string[];
  description: string;
  images: string[];
  features: [string, string][];
  amenities: [string, string][];
  reviewsText: [string, string][];
};

type ModalState = {
  title: string;
  body: string;
  confirmLabel?: string;
};

const listings: Listing[] = [
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

const categories: [string, string][] = [
  ["All", "layout-grid"],
  ["Beachfront", "waves"],
  ["Cabins", "trees"],
  ["City", "building-2"],
  ["Countryside", "leaf"],
  ["Design", "palette"],
];

const iconMap: Record<string, IconComponent> = {
  bath: Bath,
  bike: Bike,
  "book-open": BookOpen,
  "briefcase-business": BriefcaseBusiness,
  "building-2": Building2,
  car: Car,
  "chef-hat": ChefHat,
  "chevron-left": ChevronLeft,
  "circle-user-round": CircleUserRound,
  coffee: Coffee,
  flame: Flame,
  "flower-2": Flower2,
  heart: Heart,
  home: Home,
  "key-round": KeyRound,
  "layout-grid": LayoutGrid,
  leaf: Leaf,
  "map-pin": MapPin,
  menu: Menu,
  "message-circle": MessageCircle,
  moon: Moon,
  mountain: Mountain,
  music: Music,
  palette: Palette,
  send: Send,
  share: Share,
  "shield-check": ShieldCheck,
  snowflake: Snowflake,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  sunset: Sunset,
  "thermometer-sun": ThermometerSun,
  train: Train,
  trees: Trees,
  tv: Tv,
  utensils: Utensils,
  "washing-machine": WashingMachine,
  waves: Waves,
  wifi: Wifi,
  wine: Wine,
  x: X,
};

const containerStyle = { width: "min(1180px, calc(100% - 40px))" };

export function StayFinderApp() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );
  const [modal, setModal] = useState<ModalState | null>(null);

  const selectedListing = useMemo(
    () =>
      listings.find((listing) => listing.id === selectedListingId) ??
      listings[0],
    [selectedListingId],
  );

  const filteredListings = useMemo(
    () =>
      activeCategory === "All"
        ? listings
        : listings.filter((listing) => listing.category === activeCategory),
    [activeCategory],
  );

  useEffect(() => {
    if (!modal) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModal(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [modal]);

  function showBrowse() {
    setSelectedListingId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showDetail(id: string) {
    setSelectedListingId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openModal(nextModal: ModalState) {
    setModal(nextModal);
  }

  return (
    <div
      data-testid="stayfinder-app"
      className="min-h-screen bg-white text-[#202124]"
    >
      <div className="min-h-screen bg-[linear-gradient(180deg,rgba(246,247,245,0.88),rgba(255,255,255,0)_280px)]">
        <header className="sticky top-0 z-20 border-b border-[#e5e7eb]/90 bg-white/95 backdrop-blur-xl">
          <div
            className="mx-auto flex h-[76px] items-center justify-between gap-5"
            style={containerStyle}
          >
            <button
              aria-label="Show homes"
              className="inline-flex h-11 items-center gap-2.5 rounded-full border border-transparent bg-transparent pr-3 font-extrabold text-[#ff385c] transition hover:border-[#e5e7eb] hover:bg-[#f6f7f5]"
              type="button"
              onClick={showBrowse}
            >
              <span className="grid size-[34px] place-items-center rounded-full bg-[#ff385c] text-white shadow-[0_10px_20px_rgba(255,56,92,0.25)]">
                <Icon className="size-[19px]" name="home" />
              </span>
              <span className="hidden sm:inline">StayFinder</span>
            </button>

            <nav
              aria-label="Primary"
              className="flex items-center gap-2 text-sm font-bold"
            >
              <button
                className="hidden h-11 rounded-full border border-transparent px-4 transition hover:border-[#e5e7eb] hover:bg-[#f6f7f5] sm:inline-flex sm:items-center"
                type="button"
                onClick={() =>
                  openModal({
                    title: "Wishlist",
                    body: "Your saved homes will stay here during this browsing session.",
                  })
                }
              >
                Wishlist
              </button>
              <button
                className="hidden h-11 rounded-full border border-transparent px-4 transition hover:border-[#e5e7eb] hover:bg-[#f6f7f5] sm:inline-flex sm:items-center"
                type="button"
                onClick={() =>
                  openModal({
                    title: "Trips",
                    body: "Trip planning is ready for this prototype, with no page reload needed.",
                  })
                }
              >
                Trips
              </button>
              <button
                aria-label="Open profile menu"
                className="inline-flex h-11 min-w-[74px] items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-2.5 shadow-[0_6px_18px_rgba(32,33,36,0.06)] transition hover:bg-[#f6f7f5]"
                type="button"
                onClick={() =>
                  openModal({
                    title: "Profile menu",
                    body: "Sign in, hosting tools, messages, and account settings would open from here.",
                  })
                }
              >
                <Icon className="size-[19px]" name="menu" />
                <Icon className="size-[19px]" name="circle-user-round" />
              </button>
            </nav>
          </div>
        </header>

        <main className="mx-auto" style={containerStyle}>
          {selectedListingId ? (
            <DetailView
              listing={selectedListing}
              onBack={showBrowse}
              onModal={openModal}
            />
          ) : (
            <BrowseView
              activeCategory={activeCategory}
              listings={filteredListings}
              onCategoryChange={setActiveCategory}
              onOpenListing={showDetail}
            />
          )}
        </main>
      </div>

      <ActionModal modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}

function BrowseView({
  activeCategory,
  listings,
  onCategoryChange,
  onOpenListing,
}: {
  activeCategory: string;
  listings: Listing[];
  onCategoryChange: (category: string) => void;
  onOpenListing: (id: string) => void;
}) {
  return (
    <section aria-label="Homes" className="pb-12">
      <div
        aria-label="Stay categories"
        className="flex gap-2.5 overflow-x-auto py-6 sm:grid sm:grid-cols-3 lg:grid-cols-6"
        role="tablist"
      >
        {categories.map(([label, iconName]) => {
          const isActive = activeCategory === label;

          return (
            <button
              key={label}
              aria-selected={isActive}
              className={`inline-flex min-h-11 min-w-24 shrink-0 items-center justify-center gap-2 rounded-full border px-3 text-sm transition active:translate-y-px ${
                isActive
                  ? "border-[#202124] bg-[#202124] font-bold text-white shadow-[0_10px_24px_rgba(32,33,36,0.16)]"
                  : "border-[#e5e7eb] bg-white font-semibold text-[#6f7378] hover:border-[#cfd5dc] hover:text-[#202124]"
              }`}
              data-testid={`category-tab-${label}`}
              role="tab"
              type="button"
              onClick={() => onCategoryChange(label)}
            >
              <Icon className="size-[17px]" name={iconName} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-normal text-[#202124] sm:text-4xl">
            Homes with character, ready to explore.
          </h1>
          <p className="mt-2 max-w-xl text-base leading-7 text-[#6f7378]">
            Standout places shaped by setting, style, and mood, from quiet
            cabins to oceanfront villas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-[22px] gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onOpen={() => onOpenListing(listing.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ListingCard({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: () => void;
}) {
  return (
    <button
      aria-label={`View details for ${listing.title}`}
      className="group min-w-0 text-left active:translate-y-px"
      data-testid={`stayfinder-listing-${listing.id}`}
      type="button"
      onClick={onOpen}
    >
      <span className="relative block aspect-[1/0.92] overflow-hidden rounded-lg bg-[#f6f7f5]">
        <img
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]"
          loading="lazy"
          src={listing.images[0]}
        />
        <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-[#202124]/45 text-white backdrop-blur">
          <Icon className="size-[18px] fill-white/55" name="heart" />
        </span>
      </span>
      <span className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 pt-3">
        <span className="min-w-0">
          <h2 className="truncate text-base font-bold leading-tight">
            {listing.title}
          </h2>
          <p className="truncate text-sm leading-6 text-[#6f7378]">
            {listing.location}
          </p>
          <p className="truncate text-sm leading-6 text-[#6f7378]">
            {listing.style}
          </p>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-bold">
          <Icon className="size-3.5 fill-[#202124]" name="star" />
          {listing.rating}
        </span>
        <span className="col-span-2 mt-1 text-[15px]">
          <strong>{money(listing.price)}</strong> night
        </span>
      </span>
    </button>
  );
}

function DetailView({
  listing,
  onBack,
  onModal,
}: {
  listing: Listing;
  onBack: () => void;
  onModal: (modal: ModalState) => void;
}) {
  return (
    <section
      aria-label={`${listing.title} details`}
      className="pb-24 lg:pb-14"
      data-testid="stayfinder-detail"
    >
      <div className="flex items-center justify-between gap-5 py-6">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 text-sm font-bold transition hover:border-[#cfd5dc] hover:bg-[#f6f7f5]"
          type="button"
          onClick={onBack}
        >
          <Icon className="size-5" name="chevron-left" />
          <span>Homes</span>
        </button>
        <div className="flex items-center gap-2.5">
          <button
            aria-label="Share this home"
            className="grid size-11 place-items-center rounded-full border border-[#e5e7eb] bg-white transition hover:border-[#cfd5dc] hover:bg-[#f6f7f5]"
            type="button"
            onClick={() =>
              onModal({
                title: "Share this home",
                body: `${listing.title} is ready to send to a travel partner.`,
                confirmLabel: "Copy link",
              })
            }
          >
            <Icon className="size-5" name="share" />
          </button>
          <button
            aria-label="Save this home"
            className="grid size-11 place-items-center rounded-full border border-[#e5e7eb] bg-white transition hover:border-[#cfd5dc] hover:bg-[#f6f7f5]"
            type="button"
            onClick={() =>
              onModal({
                title: "Saved",
                body: `${listing.title} has been added to your wishlist.`,
              })
            }
          >
            <Icon className="size-5" name="heart" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-normal">
            {listing.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#6f7378]">
            <span>{listing.location}</span>
            <span className="size-1 rounded-full bg-[#b6bbc1]" />
            <span className="inline-flex items-center gap-1">
              <Icon className="size-3.5 fill-[#202124]" name="star" />
              {listing.rating}
            </span>
            <span className="size-1 rounded-full bg-[#b6bbc1]" />
            <span>{listing.reviews} reviews</span>
          </div>
        </div>
        <div className="text-base lg:text-right">
          <strong className="text-3xl">{money(listing.price)}</strong> / night
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-lg bg-[#e5e7eb] lg:grid-cols-[2fr_1fr_1fr] lg:grid-rows-[minmax(150px,210px)_minmax(150px,210px)]">
        {listing.images.map((image, index) => (
          <div
            key={image}
            className={`min-h-36 overflow-hidden ${
              index === 0 ? "col-span-2 row-span-2 lg:col-span-1" : ""
            }`}
          >
            <img
              alt={`${listing.title} photo ${index + 1}`}
              className="h-full w-full object-cover transition duration-300 hover:scale-[1.025]"
              src={image}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-12 pt-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <section className="border-b border-[#e5e7eb] pb-7">
            <div className="flex items-center gap-4">
              <img
                alt={listing.host}
                className="size-[58px] rounded-full object-cover"
                src={listing.hostAvatar}
              />
              <div>
                <h2 className="text-xl font-bold leading-tight">
                  Entire place hosted by {listing.host}
                </h2>
                <p className="mt-1 leading-7 text-[#6f7378]">
                  {listing.stats.join(" · ")}
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-[#e5e7eb] py-7">
            <h2 className="text-xl font-bold leading-tight">
              What makes it special
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {listing.features.map(([iconName, label]) => (
                <li key={label} className="flex min-w-0 items-center gap-3">
                  <Icon className="size-5 shrink-0 text-[#4d7c0f]" name={iconName} />
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-b border-[#e5e7eb] py-7">
            <h2 className="text-xl font-bold leading-tight">
              About this place
            </h2>
            <p className="mt-2 leading-7 text-[#6f7378]">
              {listing.description}
            </p>
          </section>

          <section className="border-b border-[#e5e7eb] py-7">
            <h2 className="text-xl font-bold leading-tight">Amenities</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {listing.amenities.map(([iconName, label]) => (
                <li key={label} className="flex min-w-0 items-center gap-3">
                  <Icon className="size-5 shrink-0 text-[#4d7c0f]" name={iconName} />
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="py-7">
            <h2 className="text-xl font-bold leading-tight">Guest notes</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {listing.reviewsText.map(([name, text]) => (
                <article
                  key={name}
                  className="rounded-lg border border-[#e5e7eb] bg-white p-5"
                >
                  <strong>{name}</strong>
                  <p className="mt-1 leading-7 text-[#6f7378]">{text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="hidden self-start rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_18px_50px_rgba(32,33,36,0.12)] lg:sticky lg:top-[104px] lg:block">
          <h2 className="text-lg font-bold">{listing.title}</h2>
          <p className="mt-1 text-[#6f7378]">
            <strong className="text-2xl text-[#202124]">
              {money(listing.price)}
            </strong>{" "}
            / night
          </p>
          <ul className="my-5 grid gap-2">
            <PanelFact label="Rating" value={listing.rating} />
            <PanelFact label="Reviews" value={String(listing.reviews)} />
            <PanelFact label="Style" value={listing.category} />
          </ul>
          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff385c,#d91f48)] px-5 font-extrabold text-white shadow-[0_14px_28px_rgba(255,56,92,0.24)] transition hover:shadow-[0_18px_34px_rgba(255,56,92,0.3)]"
            data-testid="stayfinder-request"
            type="button"
            onClick={() =>
              onModal({
                title: "Request sent",
                body: `Your request to book ${listing.title} is queued for ${listing.host}.`,
                confirmLabel: "Done",
              })
            }
          >
            <Icon className="size-5" name="send" />
            Request to book
          </button>
          <button
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 font-bold transition hover:border-[#cfd5dc] hover:bg-[#f6f7f5]"
            type="button"
            onClick={() =>
              onModal({
                title: `Contact ${listing.host}`,
                body: `A message composer for ${listing.host} opens here in the single-page prototype.`,
                confirmLabel: "Start message",
              })
            }
          >
            <Icon className="size-5" name="message-circle" />
            Contact host
          </button>
          <p className="mt-4 text-center text-sm leading-6 text-[#6f7378]">
            A host confirmation follows each request.
          </p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t border-[#e5e7eb] bg-white/95 px-5 py-3 shadow-[0_-12px_32px_rgba(32,33,36,0.12)] backdrop-blur-xl lg:hidden">
        <div className="text-sm">
          <strong>{money(listing.price)}</strong> / night
          <div className="inline-flex items-center gap-1 text-[#6f7378]">
            <Icon className="size-3.5 fill-[#202124]" name="star" />
            {listing.rating} · {listing.reviews} reviews
          </div>
        </div>
        <button
          className="inline-flex min-h-11 w-[min(190px,44vw)] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff385c,#d91f48)] px-4 font-extrabold text-white"
          type="button"
          onClick={() =>
            onModal({
              title: "Request sent",
              body: `Your request to book ${listing.title} is queued for ${listing.host}.`,
              confirmLabel: "Done",
            })
          }
        >
          <Icon className="size-5" name="send" />
          Request
        </button>
      </div>
    </section>
  );
}

function PanelFact({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] py-3 text-[#6f7378]">
      <span>{label}</span>
      <strong className="text-[#202124]">{value}</strong>
    </li>
  );
}

function ActionModal({
  modal,
  onClose,
}: {
  modal: ModalState | null;
  onClose: () => void;
}) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#202124]/45 px-4 py-6">
      <section
        aria-labelledby="stayfinder-modal-title"
        aria-modal="true"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0_18px_50px_rgba(32,33,36,0.24)]"
        data-testid="stayfinder-modal"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#ff385c]">StayFinder</p>
            <h2
              className="mt-1 text-2xl font-bold leading-tight"
              id="stayfinder-modal-title"
            >
              {modal.title}
            </h2>
          </div>
          <button
            aria-label="Close modal"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[#e5e7eb] transition hover:bg-[#f6f7f5]"
            data-testid="stayfinder-modal-close"
            type="button"
            onClick={onClose}
          >
            <Icon className="size-5" name="x" />
          </button>
        </div>
        <p className="mt-4 leading-7 text-[#6f7378]">{modal.body}</p>
        <button
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#202124] px-5 font-bold text-white"
          type="button"
          onClick={onClose}
        >
          {modal.confirmLabel ?? "Close"}
        </button>
      </section>
    </div>
  );
}

function Icon({ name, className }: { name: string; className?: string }) {
  const IconComponent = iconMap[name] ?? Circle;

  return <IconComponent aria-hidden="true" className={className} />;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
