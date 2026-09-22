"use client";

import AppShell from "@/components/app-shell";
import NotificationsPanel from "@/components/notifications-panel";

export default function NotificationsPage() {
  return (
    <AppShell title="">
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        {/* PAGE TITLE */}
        <section className="border-b-2 border-[#26312c] pb-6">
          <h1 className="font-serif text-5xl leading-none tracking-[-0.03em] text-[#17211d] lg:text-6xl">
            
          </h1>
        </section>

        {/* NOTIFICATIONS */}
        <section className="mt-8">
          <NotificationsPanel />
        </section>

        {/* FOOTER */}
        <footer className="mt-10 border-t-2 border-[#26312c] pt-5">
          <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#8a918c]">
            Archive Ref // SupplyMatch / Activity Registry
          </div>
        </footer>
      </div>
    </AppShell>
  );
}