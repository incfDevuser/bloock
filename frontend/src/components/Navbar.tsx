function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid gap-1">
        <span className="h-3 w-8 rounded-full bg-[#5f7be8]" />
        <div className="flex items-center gap-1">
          <span className="h-3 w-10 rounded-full bg-[#f4b63f]" />
          <span className="h-3 w-5 rounded-full bg-[#a0d85f]" />
        </div>
        <span className="h-3 w-14 rounded-full bg-[#d4ef4b]" />
      </div>
      <span className="text-[1.45rem] font-black tracking-[-0.06em] text-neutral-950">
        Bloock
      </span>
    </div>
  )
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f7f7f4]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <a href="#como-funciona" className="shrink-0">
          <Logo />
        </a>

        <button
          type="button"
          className="rounded-full bg-neutral-950 px-5 py-2.5 text-[0.92rem] font-semibold text-white transition hover:scale-[1.02] hover:bg-neutral-800"
        >
          Descargar para iOS
        </button>
      </div>
    </header>
  )
}
