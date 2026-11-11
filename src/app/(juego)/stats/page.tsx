import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { StatsView } from "./stats-view";

export const metadata: Metadata = { title: "Estadísticas" };

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="pt-24"><Skeleton /></div>}>
      <StatsView />
    </Suspense>
  );
}
