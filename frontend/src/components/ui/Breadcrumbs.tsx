import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {

  const processedItems = (() => {
    const homeItem = { label: "Home", href: "/dashboard" };
    if (items.length === 0) {
      return [homeItem];
    }

    if (items[0].label === "Home" && items[0].href === "/projects") {
      return [homeItem, ...items.slice(1)];
    }

    if (items[0].label !== "Home") {
      return [homeItem, ...items];
    }
    return items;
  })();

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {processedItems.map((item, index) => (
          <li key={`${item.href}-${index}`} className="flex items-center">
            <Link href={item.href} className="text-sm font-medium text-muted-foreground hover:text-primary">
              {item.label}
            </Link>
            {index < processedItems.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
