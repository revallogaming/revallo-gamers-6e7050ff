import { redirect } from "next/navigation";

// The landing page is gone — the platform IS the experience.
// Everyone goes directly to the Feed.
export default function RootPage() {
  redirect("/feed");
}
