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
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            <Link href={item.href} className="text-sm font-medium text-muted-foreground hover:text-primary">
              {item.label}
            </Link>
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
