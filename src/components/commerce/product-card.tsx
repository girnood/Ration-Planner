"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <div 
      className="group relative flex flex-col gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Quick Actions Overlay */}
        <div className="absolute top-4 right-4 z-10">
          <button className="rounded-full bg-white/80 p-2 text-gray-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Add to wishlist</span>
          </button>
        </div>

        {/* Size Picker / Add to Cart Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 bottom-0 bg-white/95 p-4 backdrop-blur-sm"
            >
               <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Select Size</p>
               <div className="flex flex-wrap gap-2 mb-3">
                 {product.sizes.map((size) => (
                   <button
                     key={size}
                     onClick={() => setSelectedSize(size)}
                     className={cn(
                       "h-8 w-8 rounded-full border text-xs flex items-center justify-center transition-colors",
                       selectedSize === size
                         ? "bg-black text-white border-black"
                         : "border-gray-300 text-gray-700 hover:border-black"
                     )}
                   >
                     {size}
                   </button>
                 ))}
               </div>
               <Button className="w-full rounded-none" disabled={!selectedSize}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {selectedSize ? "Add to Cart" : "Select Size"}
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-start">
        <div>
           <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
            <a href={`/product/${product.id}`}>
              <span aria-hidden="true" className="absolute inset-0 z-0" />
              {product.name}
            </a>
          </h3>
          <p className="mt-1 text-sm text-gray-500">{product.category}</p>
        </div>
        <p className="text-sm font-medium text-gray-900">${product.price.toFixed(2)}</p>
      </div>
    </div>
  );
}
