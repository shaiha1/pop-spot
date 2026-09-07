import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from '@/components/layout/TopNav';
import MobileNav from '@/components/layout/MobileNav';
import SiteFooter from '@/components/layout/SiteFooter';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-background)' }}>
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
