import { useState } from 'react'

const slides = [
  '/mockups/IMG_9087.PNG',
  '/mockups/IMG_9088.PNG',
  '/mockups/IMG_9090.PNG',
  '/mockups/IMG_9091.PNG',
]

export default function Hero() {
  const [active, setActive] = useState(0)

  const goPrev = () => setActive((current) => (current - 1 + slides.length) % slides.length)
  const goNext = () => setActive((current) => (current + 1) % slides.length)

  return (
    <section id="como-funciona" className="relative overflow-hidden bg-[#f7f7f4]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-0 h-64 w-64 rounded-full bg-[#d4ef4b]/30 blur-3xl" />
        <div className="absolute right-[-10%] top-[18%] h-96 w-96 rounded-full bg-[#bdd0ff]/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1360px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-10 xl:min-h-[calc(100vh-4.5rem)]">
        <div className="relative z-10 max-w-[42rem] pt-4 lg:pt-0">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-neutral-500 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <span className="h-2 w-2 rounded-full bg-[#d4ef4b]" />
            Descarga para iOS
          </div>

          <h1 className="mt-7 max-w-[11ch] text-[clamp(4.6rem,9.2vw,8.2rem)] font-black leading-[0.9] tracking-[-0.085em] text-neutral-950">
            Tu día,
            <br />
            en{' '}
            <span className="inline-block rounded-[0.18em] bg-[#d4ef4b] px-[0.14em] pb-[0.04em] pt-[0.06em] text-neutral-950 shadow-[0_0_0_0.14em_rgba(212,239,75,0.12)]">
              bloques
            </span>
            .
          </h1>

          <p className="mt-7 max-w-[24ch] text-[clamp(1.35rem,1.85vw,1.85rem)] font-medium leading-[1.16] tracking-[-0.04em] text-neutral-700 sm:max-w-[23ch]">
            Sin to-do lists eternas. Sin ansiedad.
            <br />
            Bloquéa tu día como un humano funcional.
          </p>

          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-8 py-4 text-[0.98rem] font-semibold text-white shadow-[0_25px_60px_rgba(0,0,0,0.14)] transition hover:translate-y-[-1px] hover:bg-neutral-800"
            >
              Descargar para iOS
              <span className="ml-3 text-lg">→</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[21rem] sm:max-w-[22rem] lg:max-w-[24rem]">
            <div className="absolute -right-3 top-[16%] h-[58%] w-[68%] rounded-[1.6rem] bg-[#d4ef4b]/70 blur-[1px] rotate-[8deg]" />
            <div className="absolute -left-9 bottom-[8%] h-24 w-28 rounded-[1.4rem] bg-[#bfd0fb]/80 rotate-[-11deg] shadow-[0_20px_50px_rgba(90,110,180,0.18)]" />

            <div className="relative overflow-hidden rounded-[2rem] bg-[#f7f7f4] shadow-[0_30px_70px_rgba(0,0,0,0.12)]">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${active * 100}%)` }}
              >
                {slides.map((src, index) => (
                  <div key={src} className="min-w-full p-3">
                    <img
                      src={src}
                      alt={`Mockup de la app Bloock ${index + 1}`}
                      className="h-auto w-full select-none rounded-[1.3rem] shadow-[0_18px_45px_rgba(0,0,0,0.12)]"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={goPrev}
                aria-label="Anterior"
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg font-bold text-neutral-950 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur transition hover:scale-105"
              >
                ←
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente"
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg font-bold text-neutral-950 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur transition hover:scale-105"
              >
                →
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Ir al mockup ${index + 1}`}
                  onClick={() => setActive(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === active ? 'w-8 bg-neutral-950' : 'w-2.5 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
