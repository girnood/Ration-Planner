'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Landmark,
  NotebookText,
  CircleUser,
  PanelRight,
  Goal,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { useSidebar } from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const navItems = [
  { href: '/dashboard', icon: NotebookText, label: 'الأساسيات' },
  { href: '/dashboard/debt', icon: Landmark, label: 'متتبع الديون' },
  { href: '/dashboard/income', icon: Goal, label: 'حساب الادخار' },
];

export function AppSidebar({ side = 'left' }: { side?: 'left' | 'right' }) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const avatarImage = PlaceHolderImages.find((img) => img.id === 'profile-avatar');

  return (
    <Sidebar side={side}>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <PanelRight />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: side === 'right' ? 'left' : 'right' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard/profile'}
              tooltip={{ children: 'الملف الشخصي', side: side === 'right' ? 'left' : 'right' }}
            >
              <Link href="/dashboard/profile">
                <Avatar className="h-8 w-8">
                   {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt="User Avatar" />}
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="truncate">ملف المستخدم</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
