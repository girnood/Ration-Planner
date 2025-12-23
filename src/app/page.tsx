import { Hero } from "@/components/commerce/hero";
import { ProductCard, Product } from "@/components/commerce/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Mock data for products
const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Silk Chiffon Abaya",
    price: 129.00,
    category: "Abayas",
    image: "https://images.unsplash.com/photo-1585422896695-46df2595dc06?q=80&w=1500&auto=format&fit=crop",
    sizes: ["XS", "S", "M", "L", "XL"]
  },
  {
    id: "2",
    name: "Embroidered Kaftan",
    price: 189.50,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1596783023021-9964522934ec?q=80&w=1500&auto=format&fit=crop",
    sizes: ["S", "M", "L"]
  },
  {
    id: "3",
    name: "Pleated Maxi Dress",
    price: 145.00,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1500&auto=format&fit=crop",
    sizes: ["XS", "S", "M", "L"]
  },
  {
    id: "4",
    name: "Linen Open Abaya",
    price: 95.00,
    category: "Abayas",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1500&auto=format&fit=crop",
    sizes: ["S", "M", "L", "XL"]
  }
];

export default function Home() {
  return (
    <div className="bg-white">
      <Hero />
      
      {/* Featured Collection */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
             <h2 className="text-2xl font-serif font-bold tracking-tight text-gray-900">Trending Now</h2>
             <p className="mt-2 text-sm text-gray-500">Our most coveted pieces for the season.</p>
          </div>
          <Button variant="ghost" className="hidden sm:flex group">
            View all <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <div className="mt-10 text-center sm:hidden">
           <Button variant="ghost" className="group">
            View all <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Categories / Banner Split */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-[500px] overflow-hidden group cursor-pointer">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549557404-5e1657c96417?q=80&w=1500&auto=format&fit=crop')" }}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                 <h3 className="font-serif text-3xl font-bold text-white mb-2">The Eid Collection</h3>
                 <p className="text-white mb-6">Celebrate in style with our exclusive festive range.</p>
                 <Button variant="outline" className="bg-white text-black border-white hover:bg-gray-100">Shop Collection</Button>
              </div>
            </div>
            <div className="relative h-[500px] overflow-hidden group cursor-pointer">
               <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1500&auto=format&fit=crop')" }}
              />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                 <h3 className="font-serif text-3xl font-bold text-white mb-2">Everyday Essentials</h3>
                 <p className="text-white mb-6">Timeless pieces for your daily wardrobe.</p>
                 <Button variant="outline" className="bg-white text-black border-white hover:bg-gray-100">Shop Essentials</Button>
              </div>
            </div>
         </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Join the Lumière Community
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Sign up for our newsletter to receive exclusive offers, early access to new collections, and style inspiration.
            </p>
            <form className="mt-8 sm:flex sm:justify-center">
              <input
                type="email"
                required
                className="w-full rounded-md border-gray-300 px-5 py-3 placeholder-gray-500 focus:border-black focus:ring-black sm:max-w-xs"
                placeholder="Enter your email"
              />
              <div className="mt-3 rounded-md shadow sm:ml-3 sm:mt-0">
                <Button size="lg" className="w-full bg-black text-white hover:bg-gray-800">
                  Subscribe
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
