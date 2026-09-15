"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/quests", label: "Quests" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="flex gap-4 mb-6 border-b border-gray-200 pb-3">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            isActive(tab.href, tab.exact)
              ? "text-sm font-medium text-star-dark"
              : "text-sm font-medium hover:text-star-dark hover:underline"
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
