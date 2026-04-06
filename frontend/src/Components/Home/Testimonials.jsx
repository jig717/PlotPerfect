const TESTIS = [
  { init: 'RK', name: 'Rahul Khanna', role: 'Buyer · Bangalore', stars: 5, text: 'Found my dream apartment in Bangalore within 2 weeks. Every listing was genuine and the platform feels incredibly premium.', c: '#7c3aed' },
  { init: 'SP', name: 'Sunita Patel', role: 'Property Owner · Pune', stars: 5, text: 'Listed my flat and got 15 genuine inquiries in just 3 days. The owner dashboard makes everything seamless. Best platform!', c: '#059669' },
  { init: 'AM', name: 'Arun Mehta', role: 'Agent · Mumbai', stars: 4, text: 'The analytics tools show exactly which listings perform best. This platform has completely transformed how I work with clients.', c: '#0891b2' }
]

export default function Testimonials() {
  return (
    <section className="sec alt py-16 px-6 bg-[#f9f9ff]">
      <div className="wrap max-w-7xl mx-auto">
        <div className="r text-center mb-10" data-reveal>
          <h2 className="sec-h font-serif text-2xl font-extrabold text-[#1a0a2e]">
            What Users <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Say</span>
          </h2>
          <p className="sec-sub text-sm text-[rgba(26,10,46,0.4)] mt-1">Trusted by thousands of buyers, sellers & renters</p>
        </div>

        <div className="testi-grid grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5" id="testi-grid">
          {TESTIS.map((t, i) => (
            <div
              key={t.name}
              className={`testi bg-[#f0eeff] border border-[rgba(124,58,237,0.15)] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(124,58,237,0.3)] hover:shadow-xl r d${i+1}`}
              data-reveal
            >
              <div className="stars text-[#a78bfa] text-sm tracking-widest mb-3">
                {'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}
              </div>
              <div className="overflow-hidden">
                <span className="quote-mark text-4xl text-[rgba(124,58,237,0.25)] font-serif leading-none float-left mr-2 mt-1">"</span>
                <p className="text-sm text-[rgba(26,10,46,0.7)] leading-relaxed italic">{t.text}</p>
              </div>
              <div className="mt-4 flex items-center gap-2.5">
                <div
                  className="av w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-md transition-transform group-hover:scale-110"
                  style={{ background: t.c }}
                >
                  {t.init}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1a0a2e]">{t.name}</div>
                  <div className="text-xs text-[rgba(26,10,46,0.4)]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}