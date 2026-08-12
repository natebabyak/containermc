import { BoxIcon } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="rounded-t-4xl bg-linear-to-b from-border via-transparent to-transparent">
      <div className="max-w-7xl p-4">
        <Link href="/">
          <BoxIcon />
        </Link>
        <p>&copy; 2026 ContainerMC. All rights reserved.</p>
      </div>
    </footer>
  );
}
