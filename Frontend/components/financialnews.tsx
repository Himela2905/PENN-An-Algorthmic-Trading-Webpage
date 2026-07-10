'use client';

import { useEffect, useState } from "react";
import { getNews } from "@/service/news";
import { News } from "@/types/news";
import NewsCard from "./newscard";

export default function FinancialNews() {

    const [news, setNews] = useState<News[]>([]);

    useEffect(() => {

        getNews().then(setNews);

    }, []);

    return (

        <section className="py-16">

            <h2 className="mb-8 text-3xl font-bold text-white">
                Latest Financial News
            </h2>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

                {news.map((item, index) => (

                    <NewsCard
                        key={index}
                        news={item}
                    />

                ))}

            </div>

        </section>

    );

}