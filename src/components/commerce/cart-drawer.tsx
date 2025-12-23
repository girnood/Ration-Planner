"use client";

import { ShoppingBag, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  triggerClassName?: string;
}

export function CartDrawer({ triggerClassName }: CartDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="group -m-2 flex items-center p-2 relative">
          <ShoppingBag
            className={cn("h-6 w-6 flex-shrink-0 transition-colors", triggerClassName || "text-gray-400 group-hover:text-gray-500")}
            aria-hidden="true"
          />
          <span className={cn("ml-2 text-sm font-medium transition-colors", triggerClassName || "text-gray-700 group-hover:text-gray-800")}>2</span>
          <span className="sr-only">items in cart, view bag</span>
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-1">
          <SheetTitle>Shopping Cart (2)</SheetTitle>
          <SheetDescription>
             Review your items before checkout.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex-1 overflow-y-auto pr-6">
          <ul role="list" className="-my-6 divide-y divide-gray-200">
             {/* Mock Item 1 */}
            <li className="flex py-6">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                <div className="relative h-full w-full">
                     <Image
                        src="https://images.unsplash.com/photo-1585422896695-46df2595dc06?q=80&w=200&auto=format&fit=crop"
                        alt="Silk Chiffon Abaya"
                        fill
                        className="object-cover object-center"
                     />
                </div>
              </div>

              <div className="ml-4 flex flex-1 flex-col">
                <div>
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <h3>
                      <a href="#">Silk Chiffon Abaya</a>
                    </h3>
                    <p className="ml-4">$129.00</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Black</p>
                  <p className="mt-1 text-sm text-gray-500">Size: M</p>
                </div>
                <div className="flex flex-1 items-end justify-between text-sm">
                  <div className="flex items-center space-x-2">
                     <button className="p-1 rounded-md hover:bg-gray-100">
                        <Minus className="h-3 w-3" />
                     </button>
                     <span className="text-gray-500">1</span>
                      <button className="p-1 rounded-md hover:bg-gray-100">
                        <Plus className="h-3 w-3" />
                     </button>
                  </div>

                  <div className="flex">
                    <button
                      type="button"
                      className="font-medium text-red-600 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
             {/* Mock Item 2 */}
            <li className="flex py-6">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                <div className="relative h-full w-full">
                     <Image
                        src="https://images.unsplash.com/photo-1596783023021-9964522934ec?q=80&w=200&auto=format&fit=crop"
                        alt="Embroidered Kaftan"
                        fill
                        className="object-cover object-center"
                     />
                </div>
              </div>

              <div className="ml-4 flex flex-1 flex-col">
                <div>
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <h3>
                      <a href="#">Embroidered Kaftan</a>
                    </h3>
                    <p className="ml-4">$189.50</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Gold</p>
                  <p className="mt-1 text-sm text-gray-500">Size: L</p>
                </div>
                <div className="flex flex-1 items-end justify-between text-sm">
                   <div className="flex items-center space-x-2">
                     <button className="p-1 rounded-md hover:bg-gray-100">
                        <Minus className="h-3 w-3" />
                     </button>
                     <span className="text-gray-500">1</span>
                      <button className="p-1 rounded-md hover:bg-gray-100">
                        <Plus className="h-3 w-3" />
                     </button>
                  </div>

                  <div className="flex">
                    <button
                      type="button"
                      className="font-medium text-red-600 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <SheetFooter className="mt-6 flex-col sm:justify-center gap-4">
             <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Subtotal</p>
                <p>$318.50</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
              <Button className="w-full bg-black text-white hover:bg-gray-800 h-12 text-lg" size="lg">
                Checkout
              </Button>
               <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                <p>
                  or{' '}
                  <button
                    type="button"
                    className="font-medium text-black hover:text-gray-800"
                    onClick={() => {}}
                  >
                    Continue Shopping
                    <span aria-hidden="true"> &rarr;</span>
                  </button>
                </p>
              </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
