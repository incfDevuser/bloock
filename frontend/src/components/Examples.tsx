const cards = [
  {
    name: 'Diego, 28',
    role: 'Diseñador freelance · Stgo',
    quote: 'Antes laburaba hasta las 11. Ahora cierro a las 7 y nadie se muere.',
    image: '/mockups/IMG_9087.PNG',
  },
  {
    name: 'Hector, 34',
    role: 'Ingeniero · Founder de side hustle',
    quote: 'Mi pega y mi proyecto antes peleaban. Ahora cada uno tiene su bloque.',
    image: '/mockups/IMG_9088.PNG',
  },
  {
    name: 'Cecilia, 22',
    role: 'Estudiante de Medicina',
    quote: 'Estudiar 6 hrs sin desconcentrarme. Mi Pomodoro lloró de envidia.',
    image: '/mockups/IMG_9089.PNG',
  },
]

export default function Examples() {
  return (
    <section id="ejemplos" className="bg-[#111111] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[1360px]">
        <div className="max-w-[46rem]">
          <div className="text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white/45">
            Casos reales
          </div>
          <h2 className="mt-5 text-[clamp(2.7rem,5.3vw,5.4rem)] font-black leading-[0.95] tracking-[-0.075em] text-white">
            La vida no es una to-
            <br />
            do list infinita.
          </h2>
          <p className="mt-6 max-w-[34rem] text-[clamp(1rem,1.35vw,1.25rem)] leading-[1.45] text-white/55">
            Estos son días reales de gente que usa Bloock. Ni perfectos ni aspiracionales. Reales.
          </p>
        </div>

        <div className="mt-10 grid gap-5 xl:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.name}
              className="overflow-hidden rounded-[1.7rem] bg-[#1f1f1f] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
            >
              <div className="text-[1.35rem] font-black tracking-[-0.05em] text-white">{card.name}</div>
              <div className="mt-1 text-[0.75rem] font-medium tracking-[0.18em] text-white/42">{card.role}</div>
              <p className="mt-6 max-w-[20ch] text-[clamp(1.1rem,1.5vw,1.5rem)] font-semibold italic leading-[1.18] tracking-[-0.05em] text-white">
                “{card.quote}”
              </p>

              <div className="mt-8 overflow-hidden rounded-[1.25rem] bg-[#101010] p-3.5">
                <img
                  src={card.image}
                  alt={card.name}
                  className="h-auto w-full rounded-[1rem] object-cover shadow-[0_16px_30px_rgba(0,0,0,0.25)]"
                  loading="lazy"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
