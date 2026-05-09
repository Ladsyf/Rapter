import { Link } from "react-router-dom";

export interface IBreadcrumbItem {
  label: string;
  path: string;
}

export default function Breadcrumbs({ items }: { items: IBreadcrumbItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[#94a3b8]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.path}-${item.label}`} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-medium text-[#e5e7eb]">{item.label}</span>
              ) : (
                <Link
                  to={item.path}
                  className="transition-colors duration-150 hover:text-[#dbeafe]"
                >
                  {item.label}
                </Link>
              )}
              {!isLast ? <span className="text-[#64748b]">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
