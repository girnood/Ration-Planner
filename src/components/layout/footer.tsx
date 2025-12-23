import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
               <h1 className="font-serif text-2xl font-bold tracking-tight text-gray-900">
                    LUMIÈRE
              </h1>
              <p className="text-sm text-gray-500 max-w-xs">
                Elegant fashion for the modern woman. Discover our curated collection of premium essentials.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Shop</h3>
              <ul role="list" className="mt-4 space-y-4">
                <li>
                  <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                    New Arrivals
                  </Link>
                </li>
                 <li>
                  <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                    Eid Collection
                  </Link>
                </li>
                 <li>
                  <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                    Abayas
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Support</h3>
              <ul role="list" className="mt-4 space-y-4">
                 <li>
                  <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                    Contact Us
                  </Link>
                </li>
                 <li>
                  <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                    Shipping & Returns
                  </Link>
                </li>
                 <li>
                  <Link href="#" className="text-base text-gray-500 hover:text-gray-900">
                   Size Guide
                  </Link>
                </li>
              </ul>
            </div>

            <div>
               <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Newsletter</h3>
               <p className="mt-4 text-base text-gray-500">
                Subscribe to receive updates, access to exclusive deals, and more.
              </p>
              <form className="mt-4 sm:flex sm:max-w-md">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  type="email"
                  name="email-address"
                  id="email-address"
                  autoComplete="email"
                  required
                  className="w-full min-w-0 appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Enter your email"
                />
                <div className="mt-3 sm:ml-3 sm:mt-0 sm:flex-shrink-0">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 py-10">
          <p className="text-sm text-gray-500 text-center">
            &copy; 2025 Lumière Fashion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
