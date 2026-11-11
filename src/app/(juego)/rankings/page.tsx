import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { RankingsView } from "./rankings-view";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingsPage() {
  return (
    <Suspense fallback={<div className="pt-24"><Skeleton /></div>}>
      <RankingsView />
    </Suspense>
  );
}
