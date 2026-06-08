const footerLinks = ['Instagram', 'Privacidad', 'Contacto']

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid gap-1">
        <span className="h-2.5 w-7 rounded-full bg-[#5f7be8]" />
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-9 rounded-full bg-[#f4b63f]" />
          <span className="h-2.5 w-4 rounded-full bg-[#a0d85f]" />
        </div>
        <span className="h-2.5 w-12 rounded-full bg-[#d4ef4b]" />
      </div>
      <span className="text-[1.5rem] font-black tracking-[-0.06em] text-neutral-950">Bloock</span>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-black/8 bg-[#f7f7f4] px-6 py-7 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-5 md:flex-row">
        <Logo />

        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[0.95rem] font-medium text-neutral-500">
          {footerLinks.map((item) => (
            <button key={item} type="button" className="transition hover:text-neutral-900">
              {item}
            </button>
          ))}
        </nav>

        <div className="font-mono text-[0.75rem] uppercase tracking-[0.28em] text-neutral-500">
          Made in Chile · 2026
        </div>
      </div>
    </footer>
  )
}
