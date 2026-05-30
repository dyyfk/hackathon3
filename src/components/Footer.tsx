const footerGroups = {
  About: ["How staybnb works", "Research standards", "Careers"],
  Community: ["Guest stories", "Accessibility", "Invite a friend"],
  Host: ["Host your place", "Responsible hosting", "Resources"],
  Support: ["Help center", "Flexible policies", "Trust and safety"],
};

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {Object.entries(footerGroups).map(([title, links]) => (
          <section key={title}>
            <h2 className="text-sm font-semibold text-stone-950">{title}</h2>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              {links.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-stone-950">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </footer>
  );
}
