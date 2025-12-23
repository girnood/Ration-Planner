"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="relative h-[80vh] w-full overflow-hidden bg-gray-900">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-70"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <h2 className="text-sm font-medium tracking-widest text-white uppercase mb-4">
            New Collection 2025
          </h2>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Elegance in <br />
            <span className="italic font-light">Every Stitch</span>
          </h1>
          <p className="text-lg text-gray-200 mb-8 max-w-lg">
            Discover our latest arrival of premium abayas and modest wear, designed for the modern woman who values style and grace.
          </p>
          
          <div className="flex gap-4">
            <Link href="/shop">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 rounded-none px-8 py-6 text-base">
                Shop New Arrivals
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10 hover:text-white rounded-none px-8 py-6 text-base">
                Explore Collection
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
