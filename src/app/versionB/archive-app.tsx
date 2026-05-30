"use client";

/* eslint-disable @next/next/no-img-element */
import {
  Briefcase,
  Camera,
  ConciergeBell,
  DoorOpen,
  Heart,
  HeartHandshake,
  History,
  Home,
  LucideIcon,
  Map,
  Mountain,
  Play,
  Search,
  Shield,
  Sparkles,
  Star,
  Ticket,
  TreePine,
  Trees,
  Umbrella,
  Users,
  Utensils,
  Waves,
  Wheat,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  archiveVersions,
  categoryImages,
} from "@/data/archiveVersions";

type ArchiveVersion = {
  slug: string;
  label: string;
  date: string;
  archive: string;
  template: string;
  className: string;
  brand: string;
  title: string;
  kicker: string;
  subtitle: string;
  nav: string[];
  searchButton: string;
  searchFields: string[];
  listings: string[][];
  columns: string[][];
  image: string;
  highlight?: string;
  tabs?: string[];
};

const versions = archiveVersions as ArchiveVersion[];

const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  camera: Camera,
  "concierge-bell": ConciergeBell,
  "door-open": DoorOpen,
  "heart-handshake": HeartHandshake,
  home: Home,
  map: Map,
  mountain: Mountain,
  play: Play,
  shield: Shield,
  sparkles: Sparkles,
  ticket: Ticket,
  "tree-pine": TreePine,
  trees: Trees,
  umbrella: Umbrella,
  users: Users,
  utensils: Utensils,
  waves: Waves,
  wheat: Wheat,
};

const eraStyles: Record<
  string,
  { accent: string; tint: string; dark: string; soft: string }
> = {
  "era-airbed": {
    accent: "#1f70a8",
    tint: "bg-sky-50",
    dark: "text-sky-950",
    soft: "bg-sky-100",
  },
  "era-human": {
    accent: "#4aa400",
    tint: "bg-lime-50",
    dark: "text-lime-950",
    soft: "bg-lime-100",
  },
  "era-market": {
    accent: "#1b76ba",
    tint: "bg-blue-50",
    dark: "text-blue-950",
    soft: "bg-blue-100",
  },
  "era-discovery": {
    accent: "#ed1d89",
    tint: "bg-pink-50",
    dark: "text-pink-950",
    soft: "bg-pink-100",
  },
  "era-belong": {
    accent: "#ff5a5f",
    tint: "bg-stone-950",
    dark: "text-white",
    soft: "bg-white/10",
  },
  "era-live": {
    accent: "#00a699",
    tint: "bg-teal-50",
    dark: "text-teal-950",
    soft: "bg-teal-100",
  },
  "era-trips": {
    accent: "#ff5a5f",
    tint: "bg-rose-50",
    dark: "text-rose-950",
    soft: "bg-rose-100",
  },
  "era-places": {
    accent: "#ff385c",
    tint: "bg-stone-50",
    dark: "text-stone-950",
    soft: "bg-stone-100",
  },
  "era-online": {
    accent: "#13505b",
    tint: "bg-cyan-50",
    dark: "text-cyan-950",
    soft: "bg-cyan-100",
  },
  "era-flex": {
    accent: "#8b1bb1",
    tint: "bg-emerald-950",
    dark: "text-white",
    soft: "bg-white/10",
  },
  "era-categories": {
    accent: "#111827",
    tint: "bg-white",
    dark: "text-stone-950",
    soft: "bg-stone-100",
  },
  "era-rooms": {
    accent: "#7c3aed",
    tint: "bg-violet-50",
    dark: "text-violet-950",
    soft: "bg-violet-100",
  },
  "era-services": {
    accent: "#ff385c",
    tint: "bg-white",
    dark: "text-stone-950",
    soft: "bg-rose-50",
  },
};

export function ArchiveApp() {
  const [activeSlug, setActiveSlug] = useState(versions[0].slug);
  const activeVersion = useMemo(
    () => versions.find((version) => version.slug === activeSlug) ?? versions[0],
    [activeSlug],
  );

  useEffect(() => {
    function syncFromHash() {
      const slug = window.location.hash.replace(/^#\/?/, "");
      setActiveSlug(
        versions.some((version) => version.slug === slug)
          ? slug
          : versions[0].slug,
      );
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function selectVersion(slug: string) {
    setActiveSlug(slug);
    window.history.replaceState(null, "", `#/${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-stone-950">
      <header className="sticky top-0 z-40 grid gap-4 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <button
          className="inline-flex w-fit items-center gap-2 text-left text-sm font-black"
          type="button"
          onClick={() => selectVersion(versions[0].slug)}
        >
          <span className="grid size-9 place-items-center rounded-full bg-[#ff385c] text-white">
            <History className="size-5" />
          </span>
          Airbnb Archive
        </button>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {versions.map((version) => {
            const isActive = version.slug === activeSlug;
            return (
              <button
                key={version.slug}
                className={`grid min-w-32 shrink-0 gap-0.5 rounded-lg border px-3 py-2 text-left text-xs leading-tight transition ${
                  isActive
                    ? "border-stone-950 bg-white text-stone-950 shadow-sm"
                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
                }`}
                type="button"
                onClick={() => selectVersion(version.slug)}
              >
                <span className="font-bold">{version.label}</span>
                <span className="text-[11px] text-stone-400">{version.date}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main>{renderVersion(activeVersion)}</main>

      <div className="flex flex-wrap justify-center gap-3 px-5 py-5 text-sm text-stone-500">
        <span>{activeVersion.date}</span>
        <span>Dynamic React route</span>
        <a
          className="font-bold text-[#ff385c] underline underline-offset-4"
          href={activeVersion.archive}
          rel="noreferrer"
          target="_blank"
        >
          Wayback source
        </a>
      </div>
    </div>
  );
}

function renderVersion(version: ArchiveVersion) {
  if (version.template === "classic") return <ClassicPage version={version} />;
  if (version.template === "marketplace") {
    return <MarketplacePage version={version} />;
  }
  if (version.template === "discovery") return <DiscoveryPage version={version} />;
  if (version.template === "brand") return <BrandPage version={version} />;
  if (version.template === "trips") return <TripsPage version={version} />;
  if (version.template === "modern") return <ModernPage version={version} />;
  if (version.template === "categories") {
    return <CategoriesPage version={version} />;
  }
  return <ServicesPage version={version} />;
}

function ClassicPage({ version }: { version: ArchiveVersion }) {
  const styles = styleFor(version);

  return (
    <section className={`min-h-screen px-5 py-6 ${styles.tint}`}>
      <OldNav version={version} />
      <div className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="font-serif text-lg font-bold" style={{ color: styles.accent }}>
            {version.kicker}
          </p>
          <h1 className={`mt-4 max-w-3xl font-serif text-5xl leading-tight ${styles.dark}`}>
            {version.title}
          </h1>
          <p className="mt-4 text-lg text-stone-600">{version.subtitle}</p>
          <SearchSurface version={version} />
        </div>
        <FeaturedPanel version={version} />
      </div>
      <Directory version={version} />
    </section>
  );
}

function MarketplacePage({ version }: { version: ArchiveVersion }) {
  const styles = styleFor(version);

  return (
    <section className="min-h-screen bg-slate-50">
      <OldNav version={version} />
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-4xl font-black text-slate-950">{version.title}</h1>
          <p className="mt-3 text-slate-600">{version.kicker}</p>
          <SearchSurface version={version} />
          <button
            className="mt-5 rounded-md px-5 py-3 text-sm font-black text-white"
            style={{ background: styles.accent }}
            type="button"
          >
            Calculate now &gt;&gt;
          </button>
        </div>
        <FeaturedPanel version={version} />
      </div>
      <Directory version={version} />
    </section>
  );
}

function DiscoveryPage({ version }: { version: ArchiveVersion }) {
  const styles = styleFor(version);

  return (
    <section className="bg-white">
      <OldNav version={version} />
      <HeroImage version={version} align="center">
        <div className="max-w-4xl text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em]">
            Introducing neighborhoods
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">
            {version.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
            {version.subtitle}
          </p>
        </div>
      </HeroImage>
      <div className="mx-auto -mt-10 max-w-5xl px-5">
        <SearchSurface version={version} floating />
      </div>
      <CardBand version={version} iconColor={styles.accent} />
      <Directory version={version} />
    </section>
  );
}

function BrandPage({ version }: { version: ArchiveVersion }) {
  return (
    <section className="bg-[#2b2d2e] text-white">
      <PhotoHeader version={version} />
      <HeroImage version={version} align="center">
        <div className="mx-auto max-w-3xl text-center text-white">
          <p className="text-sm font-black uppercase tracking-[0.22em]">
            {version.kicker}
          </p>
          <h1 className="mt-5 text-6xl font-black md:text-8xl">
            {version.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/85">
            {version.subtitle}
          </p>
          <SearchSurface version={version} />
        </div>
      </HeroImage>
      <CardBand version={version} iconColor="#ff5a5f" dark />
      <Directory version={version} dark />
    </section>
  );
}

function TripsPage({ version }: { version: ArchiveVersion }) {
  const styles = styleFor(version);

  return (
    <section className="bg-white">
      <PhotoHeader version={version} />
      <HeroImage version={version} align="end">
        <div className="max-w-3xl text-white">
          <p className="text-sm font-black uppercase tracking-[0.22em]">
            {version.kicker}
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">
            {version.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
            {version.subtitle}
          </p>
          {version.template === "trips" && version.tabs ? (
            <Tabs tabs={version.tabs} color={styles.accent} />
          ) : null}
        </div>
      </HeroImage>
      {version.slug.includes("2017") ? null : (
        <div className="mx-auto -mt-10 max-w-5xl px-5">
          <SearchSurface version={version} floating />
        </div>
      )}
      <CardBand version={version} iconColor={styles.accent} />
      <Directory version={version} />
    </section>
  );
}

function ModernPage({ version }: { version: ArchiveVersion }) {
  const styles = styleFor(version);
  const isFlexible = version.className.includes("era-flex");

  return (
    <section className={isFlexible ? "bg-emerald-950" : "bg-white"}>
      <div className="bg-stone-950 px-5 py-3 text-center text-sm font-bold text-white">
        {version.kicker}
      </div>
      <PhotoHeader version={version} dark={isFlexible} />
      <HeroImage version={version} align="end" muted={!isFlexible}>
        <div className={isFlexible ? "text-white" : "text-stone-950"}>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
            {version.title}
          </h1>
          <p className={`mt-5 max-w-2xl text-lg leading-8 ${isFlexible ? "text-white/85" : "text-stone-600"}`}>
            {version.subtitle}
          </p>
          {version.tabs ? <Tabs tabs={version.tabs} color={styles.accent} /> : null}
          {isFlexible ? (
            <button className="mt-8 rounded-full bg-white px-10 py-5 text-xl font-black text-purple-700 shadow-xl">
              {version.searchButton}
            </button>
          ) : (
            <SearchSurface version={version} />
          )}
        </div>
      </HeroImage>
      <CardBand version={version} iconColor={styles.accent} />
      <Directory version={version} />
    </section>
  );
}

function CategoriesPage({ version }: { version: ArchiveVersion }) {
  const styles = styleFor(version);
  const tabs = version.tabs ?? [];

  return (
    <section className="min-h-screen bg-white">
      <PhotoHeader version={version} compact />
      <div className="sticky top-[72px] z-20 border-b border-stone-200 bg-white/95 px-5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto py-4">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`grid min-w-24 shrink-0 justify-items-center gap-2 border-b-2 pb-3 text-xs font-bold ${
                index === 0
                  ? "border-stone-950 text-stone-950"
                  : "border-transparent text-stone-500"
              }`}
              type="button"
            >
              <ArchiveIcon name={categoryIcon(tab)} className="size-5" />
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: styles.accent }}>
            {version.title}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-normal md:text-6xl">
            {version.kicker}
          </h1>
          <p className="mt-4 max-w-2xl text-stone-600">{version.subtitle}</p>
        </div>
        <SearchSurface version={version} compact />
      </div>
      <div className="mx-auto grid max-w-6xl gap-7 px-5 pb-12 md:grid-cols-2 lg:grid-cols-4">
        {version.listings.map(([title, subtitle, price, rating], index) => (
          <article key={title} className="min-w-0">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                alt=""
                className="aspect-square w-full object-cover"
                src={categoryImages[index % categoryImages.length]}
              />
              <button
                aria-label="Save listing"
                className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90"
                type="button"
              >
                <Heart className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <h2 className="truncate font-bold">{title}</h2>
                <p className="truncate text-stone-500">{subtitle}</p>
                <p className="mt-1 font-semibold">{price}</p>
              </div>
              <span className="inline-flex items-center gap-1">
                <Star className="size-3 fill-current" />
                {rating}
              </span>
            </div>
          </article>
        ))}
      </div>
      <Directory version={version} />
    </section>
  );
}

function ServicesPage({ version }: { version: ArchiveVersion }) {
  const styles = styleFor(version);

  return (
    <section className="min-h-screen bg-white">
      <PhotoHeader version={version} compact />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] lg:items-center">
        <div>
          <Tabs tabs={version.tabs ?? []} color={styles.accent} />
          <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">
            {version.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
            {version.subtitle}
          </p>
          <SearchSurface version={version} />
        </div>
        <img
          alt=""
          className="min-h-[420px] w-full rounded-2xl object-cover shadow-2xl"
          src={version.image}
        />
      </div>
      <CardBand version={version} iconColor={styles.accent} />
      <Directory version={version} />
    </section>
  );
}

function OldNav({ version }: { version: ArchiveVersion }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
      <strong className="text-2xl font-black text-[#ff385c]">
        {version.brand}
      </strong>
      <nav className="flex flex-wrap justify-end gap-3 text-sm font-bold text-stone-600">
        {version.nav.map((item) => (
          <a key={item} href="#">
            {item}
          </a>
        ))}
      </nav>
    </header>
  );
}

function PhotoHeader({
  version,
  compact,
  dark,
}: {
  version: ArchiveVersion;
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <header
      className={`border-b px-5 py-4 ${
        dark ? "border-white/10 text-white" : "border-stone-200 text-stone-950"
      } ${compact ? "sticky top-[73px] z-30 bg-white/95 backdrop-blur" : ""}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
        <strong className="text-2xl font-black text-[#ff385c]">
          {version.brand}
        </strong>
        <nav className="flex flex-wrap justify-end gap-4 text-sm font-bold">
          {version.nav.map((item, index) => (
            <a
              key={item}
              className={index < 3 && compact ? "rounded-full bg-stone-100 px-4 py-2" : ""}
              href="#"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function HeroImage({
  version,
  children,
  align,
  muted,
}: {
  version: ArchiveVersion;
  children: React.ReactNode;
  align: "center" | "end";
  muted?: boolean;
}) {
  return (
    <section
      className={`relative grid min-h-[590px] overflow-hidden px-6 py-16 ${
        align === "center" ? "place-items-center" : "items-end"
      }`}
    >
      <img
        alt=""
        className="absolute inset-0 size-full object-cover"
        src={version.image}
      />
      <div
        className={`absolute inset-0 ${
          muted
            ? "bg-gradient-to-r from-white/85 via-white/40 to-transparent"
            : "bg-black/45"
        }`}
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function FeaturedPanel({ version }: { version: ArchiveVersion }) {
  const styles = styleFor(version);

  return (
    <aside className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-xl">
      <img alt="" className="h-60 w-full object-cover" src={version.image} />
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: styles.accent }}>
          Featured
        </p>
        <h2 className="mt-2 text-2xl font-black">{version.listings[0][0]}</h2>
        <p className="mt-2 text-stone-600">{version.listings[0][1]}</p>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-100 p-3 text-sm">
          <strong>{version.listings[0][2]}</strong>
          <span>{version.listings[0][3]}</span>
        </div>
      </div>
    </aside>
  );
}

function SearchSurface({
  version,
  compact,
  floating,
}: {
  version: ArchiveVersion;
  compact?: boolean;
  floating?: boolean;
}) {
  const styles = styleFor(version);

  return (
    <form
      className={`mt-6 grid overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl ${
        compact ? "min-w-[320px] md:grid-cols-[1fr_auto]" : "md:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
      } ${floating ? "relative z-10" : ""}`}
    >
      {version.searchFields.map((field) => (
        <label
          key={field}
          className="grid gap-1 border-b border-stone-200 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-stone-500 md:border-b-0 md:border-r"
        >
          {field}
          <input
            className="min-w-0 border-0 bg-transparent text-sm font-medium normal-case tracking-normal text-stone-950 outline-none"
            placeholder={placeholderFor(field)}
          />
        </label>
      ))}
      <button
        className="inline-flex min-h-14 items-center justify-center gap-2 px-5 font-black text-white"
        style={{ background: styles.accent }}
        type="button"
      >
        <Search className="size-4" />
        <span>{version.searchButton}</span>
      </button>
    </form>
  );
}

function CardBand({
  version,
  iconColor,
  dark,
}: {
  version: ArchiveVersion;
  iconColor: string;
  dark?: boolean;
}) {
  return (
    <section className={`px-5 py-12 ${dark ? "bg-[#2b2d2e] text-white" : "bg-white"}`}>
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {version.listings.slice(0, 3).map(([title, subtitle, meta, iconName]) => (
          <article
            key={title}
            className={`rounded-2xl border p-6 ${
              dark
                ? "border-white/10 bg-white/5"
                : "border-stone-200 bg-white shadow-sm"
            }`}
          >
            <span
              className="grid size-12 place-items-center rounded-full text-white"
              style={{ background: iconColor }}
            >
              <ArchiveIcon name={iconName} className="size-5" />
            </span>
            <h2 className="mt-5 text-2xl font-black">{title}</h2>
            <p className={`mt-3 leading-7 ${dark ? "text-white/70" : "text-stone-600"}`}>
              {subtitle}
            </p>
            <p className="mt-4 text-sm font-black" style={{ color: dark ? "#fff" : iconColor }}>
              {meta}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Directory({
  version,
  dark,
}: {
  version: ArchiveVersion;
  dark?: boolean;
}) {
  return (
    <footer className={`px-5 py-10 ${dark ? "bg-[#2b2d2e] text-white" : "bg-stone-100 text-stone-950"}`}>
      <div className="mx-auto grid max-w-6xl gap-7 md:grid-cols-3">
        {version.columns.map(([title, ...items]) => (
          <div key={title}>
            <h2 className="text-sm font-black uppercase tracking-[0.14em]">
              {title}
            </h2>
            <div className={`mt-4 grid gap-2 text-sm ${dark ? "text-white/70" : "text-stone-600"}`}>
              {items.map((item) => (
                <a key={item} href="#">
                  {item}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

function Tabs({ tabs, color }: { tabs: string[]; color: string }) {
  if (!tabs.length) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className="rounded-full border px-4 py-2 text-sm font-black"
          style={{
            background: index === 0 ? color : "rgba(255,255,255,0.9)",
            borderColor: index === 0 ? color : "rgba(0,0,0,0.12)",
            color: index === 0 ? "#fff" : "#222",
          }}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function ArchiveIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon className={className} />;
}

function styleFor(version: ArchiveVersion) {
  const key =
    Object.keys(eraStyles).find((styleName) =>
      version.className.includes(styleName),
    ) ?? "era-services";
  return eraStyles[key];
}

function categoryIcon(tab: string) {
  const key = tab.toLowerCase();
  if (key.includes("room")) return "door-open";
  if (key.includes("pool")) return "waves";
  if (key.includes("beach")) return "umbrella";
  if (key.includes("cabin")) return "trees";
  if (key.includes("tree")) return "tree-pine";
  if (key.includes("farm")) return "wheat";
  if (key.includes("tiny")) return "home";
  if (key.includes("view")) return "mountain";
  return "sparkles";
}

function placeholderFor(field: string) {
  const key = field.toLowerCase();
  if (key.includes("where") || key.includes("location") || key.includes("anywhere")) {
    return "Search destinations";
  }
  if (key.includes("guest") || key.includes("who")) return "Add guests";
  if (key.includes("date") || key.includes("week") || key.includes("check")) {
    return "Add dates";
  }
  return "Add details";
}
