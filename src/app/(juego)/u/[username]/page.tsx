import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileView } from "./profile-view";
import { Skeleton } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}` };
}

export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <Suspense fallback={<div className="pt-24"><Skeleton /></div>}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: PageProps<"/u/[username]">["params"] }) {
  const { username } = await params;
  return <ProfileView username={decodeURIComponent(username)} />;
}
