"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { getTopTags } from "@/app/actions/contacts";

export function TopTags() {
  const [tags, setTags] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    getTopTags().then(setTags);
  }, []);

  if (tags.length === 0) return null;

  return (
    <div className="px-4 py-4 space-y-2 mt-auto">
      <div className="flex items-center gap-2 px-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
        <Tag className="w-3.5 h-3.5" />
        Top Tags
      </div>
      <div className="flex flex-col gap-0.5">
        {tags.map(tag => (
          <Link key={tag.name} href={`/contacts?tag=${encodeURIComponent(tag.name)}`}>
            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 text-sm transition-colors text-sidebar-foreground/80 group">
              <span className="truncate">#{tag.name}</span>
              <span className="text-xs font-medium text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70 bg-sidebar-accent/50 px-1.5 py-0.5 rounded-md">
                {tag.count}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
