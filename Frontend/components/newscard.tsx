'use client';

import { News } from "@/types/news";

export default function NewsCard({ news }: { news: News }) {

    return (
  <a
    href={news.url}
    target="_blank"
    rel="noreferrer"
    className="group flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/40"
  >

    <img
      src={news.image}
      alt={news.headline}
      className="h-20 w-28 rounded-lg object-cover flex-shrink-0"
    />

    <div className="flex flex-col justify-between">

      <span className="text-[11px] uppercase tracking-wide text-zinc-500">
        {news.source}
      </span>

      <h3 className="line-clamp-2 text-sm font-medium text-white">
        {news.headline}
      </h3>

      <p className="line-clamp-2 text-xs text-zinc-400">
        {news.summary}
      </p>

    </div>

  </a>
);

}