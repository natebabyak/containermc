import {
  CpuIcon,
  HardDriveIcon,
  type LucideIcon,
  MemoryStickIcon,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { CPU_PRICE, MEMORY_PRICE, STORAGE_PRICE } from "@/lib/constants";
import { PricingCalculator } from "./pricing-calculator";

const RESOURCES = [
  {
    icon: CpuIcon,
    title: "CPU",
    description: `$${CPU_PRICE} per CPU per second`,
  },
  {
    icon: MemoryStickIcon,
    title: "Memory",
    description: `${MEMORY_PRICE} per GB per second`,
  },
  {
    icon: HardDriveIcon,
    title: "Storage",
    description: `${STORAGE_PRICE} per GB per month`,
  },
] satisfies Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}>;

export default function Pricing() {
  return (
    <div>
      <Header />
      <main className="max-w-3xl mx-auto py-4">
        <h1 className="text-3xl tracking-tighter text-balance">
          Pay only for what your server uses, by the second
        </h1>
        <ItemGroup>
          {RESOURCES.map((resource) => (
            <Item key={resource.description} variant="outline">
              <ItemMedia variant="image">
                <resource.icon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{resource.title}</ItemTitle>
                <ItemDescription>{resource.description}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
        <h2 className="text-2xl text-center">Pricing Calculator</h2>
        <PricingCalculator />
      </main>
      <Footer />
    </div>
  );
}
