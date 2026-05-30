import Link from "next/link";
import { Menu, Search } from "lucide-react";

export function Header() {
  return (
    <header
      data-testid="header"
      className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          data-testid="brand-logo"
          className="flex items-center gap-2 text-xl font-semibold text-stone-950"
          aria-label="staybnb home"
        >
          <span className="grid size-9 place-items-center rounded-full bg-[#e95f45] text-sm font-bold text-white">
            S
          </span>
          <span>staybnb</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-stone-700 md:flex">
          <Link data-testid="nav-places" href="/" className="hover:text-stone-950">
            Places to stay
          </Link>
          <Link data-testid="nav-experiences" href="/" className="hover:text-stone-950">
            Experiences
          </Link>
          <Link
            data-testid="nav-online-experiences"
            href="/"
            className="hover:text-stone-950"
          >
            Online experiences
          </Link>
        </nav>

        <div className="hidden items-center gap-4 text-sm font-medium text-stone-700 md:flex">
          <Link
            data-testid="become-host-link"
            href="/"
            className="rounded-full px-3 py-2 hover:bg-stone-100"
          >
            Become a host
          </Link>
          <Link data-testid="signup-link" href="/" className="hover:text-stone-950">
            Sign up
          </Link>
          <Link data-testid="login-link" href="/" className="hover:text-stone-950">
            Log in
          </Link>
        </div>

        <button
          data-testid="user-menu-button"
          aria-label="Open user menu"
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm font-medium hover:shadow-sm"
          type="button"
        >
          <Search className="size-4 md:hidden" />
          <Menu className="hidden size-4 md:block" />
          <span className="md:hidden">Explore</span>
          <span className="hidden md:inline">Menu</span>
        </button>
      </div>
    </header>
  );
}
