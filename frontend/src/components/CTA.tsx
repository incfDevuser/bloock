export default function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden bg-[#d7ef4e] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute left-[-8%] top-[-6%] h-[30rem] w-[30rem] rounded-full border-[5rem] border-black/6" />
        <div className="absolute right-[-8%] top-[-2%] h-[34rem] w-[34rem] rounded-full border-[5rem] border-black/6" />
        <div className="absolute left-1/2 top-10 h-[22rem] w-[9rem] -translate-x-1/2 rounded-full bg-black/6" />
      </div>

      <div className="relative mx-auto flex max-w-[1360px] flex-col items-center text-center">
        <h2 className="text-[clamp(3.4rem,7.5vw,7rem)] font-black leading-[0.92] tracking-[-0.09em] text-neutral-950">
          Ya po.
          <br />
          <span className="italic">Bloquéa el día.</span>
        </h2>

        <p className="mt-8 max-w-[24rem] text-[clamp(1rem,1.45vw,1.35rem)] leading-[1.35] text-neutral-900/90">
          Salimos pronto. Sé el primero en ordenar el caos.
        </p>

        <form
          className="mt-10 flex w-full max-w-[40rem] items-stretch rounded-full bg-white p-2 shadow-[0_25px_70px_rgba(34,49,0,0.12)]"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            type="email"
            placeholder="tu@email.cl"
            className="min-w-0 flex-1 rounded-full bg-transparent px-6 py-4 text-[0.95rem] font-medium text-neutral-950 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            className="rounded-full bg-neutral-950 px-6 py-4 text-[0.95rem] font-semibold text-white transition hover:bg-neutral-800"
          >
            Sumarme →
          </button>
        </form>

        <div className="mt-6 font-mono text-[0.75rem] uppercase tracking-[0.35em] text-neutral-900/70">
          Sin spam. Solo cuando esté lista.
        </div>
      </div>
    </section>
  )
}
