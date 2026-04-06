export default function Footer() {
  return (
    <footer className="bg-[#040109] text-white py-12 px-6 border-t border-white/5">
      <div className="wrap max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-9 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 bg-linear-to-br from-[#a78bfa] to-[#7c3aed] rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <span className="font-serif text-lg font-extrabold text-white">Plot<span className="text-[#a78bfa]">Perfect</span></span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed max-w-60">
              India's most trusted real estate platform across 150+ cities. Verified listings, zero brokerage.
            </p>
          </div>

          <div>
            <h4 className="foot-h text-[11.5px] font-bold text-white/40 uppercase tracking-wider mb-3.5">For Buyers</h4>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Buy Property</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">New Projects</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Home Loans</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Property Valuation</a>
          </div>

          <div>
            <h4 className="foot-h text-[11.5px] font-bold text-white/40 uppercase tracking-wider mb-3.5">For Owners</h4>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Post Property Free</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Manage Listings</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Rental Agreement</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Tenant Verification</a>
          </div>

          <div>
            <h4 className="foot-h text-[11.5px] font-bold text-white/40 uppercase tracking-wider mb-3.5">Company</h4>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">About Us</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Careers</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Support</a>
            <a className="foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition">Privacy Policy</a>
          </div>
        </div>

        <div className="border-t border-white/5 pt-5 flex justify-between flex-wrap gap-2.5">
          <span className="text-xs text-white/20">© 2026 PlotPerfect Pvt. Ltd. All rights reserved.</span>
          <span className="text-xs text-white/20">Made with <span className="text-[#7c3aed]">♥</span> for India</span>
        </div>
      </div>
    </footer>
  )
}