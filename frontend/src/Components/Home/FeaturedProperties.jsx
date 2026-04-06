import PropertyCard from '../property/PropertyCard'

const CARDS = [
  {
    badge: 'For Sale', bc: '#7c3aed', price: '₹1.25 Cr', sub: 'onwards',
    title: '3 BHK Luxury Flat in Bandra West', loc: 'Bandra West, Mumbai',
    chips: ['🛏 3 BHK', '🚿 2 Bath', '📐 1240 sqft'],
    grad: 'linear-gradient(135deg,#1a0a2e,#3b1f7c)', init: 'RK', initC: '#7c3aed', isNew: true, cls: 'cb-sale'
  },
  {
    badge: "For Sale", bc: "#7c3aed", price: "₹1.25 Cr", sub: "onwards",
    title: "3 BHK Luxury Flat in Bandra West", loc: "Bandra West, Mumbai",
    chips: ["🛏 3 BHK", "🚿 2 Bath", "📐 1240 sqft"],
    grad: "linear-gradient(135deg,#1a0a2e,#3b1f7c)", init: "RK", initC: "#7c3aed", isNew: true, cls: "cb-sale"
  },
  {
    badge: "For Rent", bc: "#0891b2", price: "₹28,000", sub: "/month",
    title: "2 BHK Semi-Furnished Apartment", loc: "Koramangala, Bangalore",
    chips: ["🛏 2 BHK", "🚿 2 Bath", "📐 980 sqft"],
    grad: "linear-gradient(135deg,#001833,#003875)", init: "SP", initC: "#059669", isNew: false, cls: "cb-rent"
  },
  {
    badge: "For Sale", bc: "#7c3aed", price: "₹78 L", sub: "onwards",
    title: "4 BHK Independent Villa with Garden", loc: "Gachibowli, Hyderabad",
    chips: ["🛏 4 BHK", "🚿 3 Bath", "📐 2100 sqft"],
    grad: "linear-gradient(135deg,#200a40,#4a1580)", init: "AM", initC: "#a78bfa", isNew: false, cls: "cb-sale"
  },
  {
    badge: "PG", bc: "#059669", price: "₹8,500", sub: "/month",
    title: "PG for Boys — AC Rooms Available", loc: "Andheri East, Mumbai",
    chips: ["🛏 Single", "🍽 Meals", "📶 Wi-Fi"],
    grad: "linear-gradient(135deg,#001a12,#003d28)", init: "NK", initC: "#059669", isNew: true, cls: "cb-pg"
  },
  {
    badge: "For Sale", bc: "#7c3aed", price: "₹45 L", sub: "onwards",
    title: "2 BHK Ready to Move Apartment", loc: "Wakad, Pune",
    chips: ["🛏 2 BHK", "🚿 2 Bath", "📐 870 sqft"],
    grad: "linear-gradient(135deg,#130a2e,#2d1060)", init: "PS", initC: "#7c3aed", isNew: false, cls: "cb-sale"
  }
];

export default function FeaturedProperties() {
  return (
    <section className="sec alt py-16 px-6 bg-[#f9f9ff]">
      <div className="wrap max-w-7xl mx-auto">
        <div className="sec-head flex justify-between items-end mb-8 r" data-reveal>
          <div>
            <h2 className="sec-h font-serif text-2xl font-extrabold text-[#1a0a2e]">
              Featured <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Properties</span>
            </h2>
            <p className="sec-sub text-sm text-[rgba(26,10,46,0.4)] mt-1">Verified listings from trusted owners and agents</p>
          </div>
          <button className="see-all text-sm font-semibold text-[#a78bfa] hover:text-[#7c3aed] hover:underline">View All →</button>
        </div>

        <div className="cards-grid grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5" id="cards-grid">
          {CARDS.map((card, i) => (
            <PropertyCard key={i} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}