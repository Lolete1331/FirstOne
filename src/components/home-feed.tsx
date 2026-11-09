"use client";
import Link from "next/link";
import { useLiveFeed } from "@/lib/hooks/use-live-feed";
import { FeedList, LiveDot } from "./feed-list";

export function HomeFeed() {
  const { items, status } = useLiveFeed(8);
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
          <LiveDot status={status} /> En vivo
        </p>
        <Link href="/live" className="text-xs text-muted hover:text-lime">
          Ver todo →
        </Link>
      </div>
      <FeedList items={items} />
    </div>
  );
}
