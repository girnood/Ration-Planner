"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, X, Heart, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartDrawer } from "@/components/commerce/cart-drawer";

const navigation = {
  categories: [
    {
      id: 'eid-collection',
      name: 'Eid Collection',
      featured: [
        { name: 'New Arrivals', href: '#' },
        { name: 'Best Sellers', href: '#' },
      ],
      sections: [
        {
          id: 'clothing',
          name: 'Clothing',
          items: [
            { name: 'Dresses', href: '#' },
            { name: 'Abayas', href: '#' },
            { name: 'Kaftans', href: '#' },
            { name: 'Tops', href: '#' },
          ],
        },
        {
          id: 'accessories',
          name: 'Accessories',
          items: [
            { name: 'Scarves', href: '#' },
            { name: 'Jewelry', href: '#' },
            { name: 'Bags', href: '#' },
          ],
        },
      ],
    },
    {
      id: 'abayas',
      name: 'Abayas',
      featured: [],
      sections: [
        {
          id: 'style',
          name: 'By Style',
          items: [
            { name: 'Open Abayas', href: '#' },
            { name: 'Closed Abayas', href: '#' },
            { name: 'Kimono Abayas', href: '#' },
          ],
        }
      ]
    },
    {
      id: 'vip-wear',
      name: 'VIP Wear',
      featured: [],
      sections: []
    }
  ],
  pages: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
};

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-white">
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-50 flex lg:hidden"
          >
            <div className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl">
              <div className="flex px-4 pb-2 pt-5">
                <button
                  type="button"
                  className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                {navigation.categories.map((category) => (
                  <div key={category.name} className="flow-root">
                    <a href="#" className="-m-2 block p-2 font-medium text-gray-900">
                      {category.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={cn(
        "fixed w-full z-40 transition-all duration-300",
        isScrolled || mobileMenuOpen ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent text-white hover:bg-white/90 hover:text-black"
      )}>
        <nav aria-label="Top" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200/20 pb-px">
            <div className="flex h-16 items-center">
              <button
                type="button"
                className="rounded-md p-2 lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Logo */}
              <div className="ml-4 flex lg:ml-0">
                <Link href="/">
                  <span className="sr-only">Lumière</span>
                  <h1 className={cn(
                    "font-serif text-2xl font-bold tracking-tight transition-colors",
                    isScrolled ? "text-gray-900" : "text-gray-900 lg:text-white lg:hover:text-gray-900"
                  )}>
                    LUMIÈRE
                  </h1>
                </Link>
              </div>

              {/* Flyout menus */}
              <div className="hidden lg:ml-8 lg:block lg:self-stretch">
                <div className="flex h-full space-x-8">
                  {navigation.categories.map((category) => (
                    <div
                      key={category.name}
                      className="flex"
                      onMouseEnter={() => setActiveCategory(category.id)}
                      onMouseLeave={() => setActiveCategory(null)}
                    >
                      <div className="relative flex">
                        <Link
                          href={`/category/${category.id}`}
                          className={cn(
                            "relative z-10 -mb-px flex items-center border-b-2 pt-px text-sm font-medium transition-colors duration-200 ease-out",
                            activeCategory === category.id
                              ? "border-white text-white lg:text-gray-900 lg:border-gray-900" // active state logic needs adjustment based on scroll
                              : "border-transparent text-gray-700 hover:text-gray-800",
                             isScrolled ? "text-gray-700 hover:text-black" : "text-white/90 hover:text-white"
                          )}
                        >
                          {category.name}
                        </Link>
                      </div>

                      {/* Mega Menu */}
                      <AnimatePresence>
                        {activeCategory === category.id && (category.sections.length > 0 || category.featured.length > 0) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute inset-x-0 top-full text-sm text-gray-500 bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                          >
                             {/* Keep the mega menu text always dark */}
                            <div className="mx-auto max-w-7xl px-8 py-10">
                              <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                                <div className="col-start-2 grid grid-cols-2 gap-x-8">
                                  {category.featured.map((item) => (
                                    <div key={item.name} className="group relative text-base sm:text-sm">
                                      <a href={item.href} className="mt-6 block font-medium text-gray-900">
                                        <span className="absolute inset-0 z-10" aria-hidden="true" />
                                        {item.name}
                                      </a>
                                      <p aria-hidden="true" className="mt-1">Shop now</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="row-start-1 grid grid-cols-3 gap-x-8 gap-y-10 text-sm">
                                  {category.sections.map((section) => (
                                    <div key={section.name}>
                                      <p id={`${section.name}-heading`} className="font-medium text-gray-900">
                                        {section.name}
                                      </p>
                                      <ul
                                        role="list"
                                        aria-labelledby={`${section.name}-heading`}
                                        className="mt-6 space-y-6 sm:mt-4 sm:space-y-4"
                                      >
                                        {section.items.map((item) => (
                                          <li key={item.name} className="flex">
                                            <a href={item.href} className="hover:text-gray-800">
                                              {item.name}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex items-center">
                <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
                   {/* Search Bar */}
                   <div className="flex items-center">
                      <AnimatePresence>
                        {isSearchOpen && (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 200, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="overflow-hidden mr-2"
                          >
                            <Input 
                              type="search" 
                              placeholder="Search..." 
                              className={cn(
                                "h-8 bg-transparent border-b border-0 rounded-none focus-visible:ring-0 placeholder:text-gray-400",
                                isScrolled ? "text-gray-900 border-gray-300" : "text-white border-white/50"
                              )}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={cn("p-2 hover:text-gray-500", isScrolled ? "text-gray-400" : "text-white/90")}
                      >
                        <span className="sr-only">Search</span>
                        <Search className="h-6 w-6" aria-hidden="true" />
                      </button>
                   </div>
                   
                  <div className="flex lg:ml-6">
                     <a href="#" className={cn("p-2 hover:text-gray-500", isScrolled ? "text-gray-400" : "text-white/90")}>
                      <span className="sr-only">Account</span>
                      <User className="h-6 w-6" aria-hidden="true" />
                    </a>
                  </div>
                   <div className="flex lg:ml-6">
                     <a href="#" className={cn("p-2 hover:text-gray-500", isScrolled ? "text-gray-400" : "text-white/90")}>
                      <span className="sr-only">Wishlist</span>
                      <Heart className="h-6 w-6" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                {/* Cart */}
                <div className="ml-4 flow-root lg:ml-6">
                  <CartDrawer triggerClassName={isScrolled ? "text-gray-400 hover:text-gray-500" : "text-white/90 hover:text-white"} />
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}
