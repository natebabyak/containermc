import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <header className="p-4 flex">
        <Link href="/" className="flex gap-2 items-center">
          ContainerMC
        </Link>
        <div className="flex gap-2">
          <Button
            render={<Link href="/sign-in" />}
            nativeButton={false}
            size="lg"
            variant="ghost"
          >
            Sign in
          </Button>
          <Button
            render={<Link href="/sign-up" />}
            nativeButton={false}
            size="lg"
            variant="outline"
          >
            Sign up
          </Button>
        </div>
      </header>
      <main></main>
      <footer></footer>
    </div>
  );
}
