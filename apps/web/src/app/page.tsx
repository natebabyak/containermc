import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <Header />
      <main>
        <section className="space-y-4">
          <h1 className="text-5xl text-balance tracking-tighter">
            Hosting that automatically scales with you from zero
          </h1>
          <p className="text-lg text-balance text-muted-foreground">
            Pay only for the resources you use, by the second. Optimize your
            costs and performance effortlessly.
          </p>
          <div className="flex gap-2">
            <Button
              render={<Link href="/sign-in" />}
              nativeButton={false}
              size="lg"
            >
              Get Started
              <ArrowRightIcon />
            </Button>
            <Button
              render={<Link href="/pricing" />}
              nativeButton={false}
              size="lg"
              variant="outline"
            >
              Pricing
            </Button>
          </div>
        </section>
      </main>
      <footer></footer>
    </div>
  );
}
