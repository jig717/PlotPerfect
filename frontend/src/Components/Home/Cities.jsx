const CITIES = [
  { city: 'Mumbai', cnt: '1.2L', e: '🌊' },
  { city: 'Bangalore', cnt: '98K', e: '🌿' },
  { city: 'Delhi NCR', cnt: '1.5L', e: '🏛' },
  { city: 'Hyderabad', cnt: '87K', e: '💎' },
  { city: 'Pune', cnt: '72K', e: '🎓' },
  { city: 'Chennai', cnt: '64K', e: '🌴' },
  { city: 'Ahmedabad', cnt: '55K', e: '🏺' },
  { city: 'Kolkata', cnt: '48K', e: '🌸' }
]

export default function Cities() {
  return (
    <section className="sec py-16 px-6">
      <div className="wrap max-w-7xl mx-auto">
        <div className="sec-head flex justify-between items-end mb-8 r" data-reveal>
          <div>
            <h2 className="sec-h font-serif text-2xl font-extrabold text-[#1a0a2e]">
              Top <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Cities</span>
            </h2>
            <p className="sec-sub text-sm text-[rgba(26,10,46,0.4)] mt-1">Find properties in your city</p>
          </div>
        </div>

        <div className="cities-grid grid grid-cols-[repeat(auto-fill,minmax(195px,1fr))] gap-3" id="cities-grid">
          {CITIES.map((c, i) => (
            <div
              key={c.city}
              className={`city-card bg-[#f0eeff] border border-[rgba(124,58,237,0.15)] rounded-[14px] p-4 cursor-pointer flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:scale-102 hover:border-[rgba(124,58,237,0.45)] hover:bg-[#e8e4ff] hover:shadow-lg r d${i+1}`}
              data-reveal
            >
              <span className="city-emoji text-2xl transition-transform group-hover:scale-125 group-hover:-rotate-8">{c.e}</span>
              <div>
                <div className="text-sm font-bold text-[#1a0a2e]">{c.city}</div>
                <div className="text-xs text-[rgba(26,10,46,0.4)] mt-0.5">{c.cnt} properties</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}