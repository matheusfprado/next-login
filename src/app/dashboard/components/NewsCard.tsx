"use client";
import React from "react";
import Image from "next/image";

interface NewsCardProps {
  title: string;
  description: string;
  image?: string;
  url: string;
}

export default function NewsCard({ title, description, image, url }: NewsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-xl transition overflow-hidden">
      {image && (
        <Image
          src={image}
          alt={title}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h4 className="text-gray-900 font-semibold text-md mb-2">{title}</h4>
        <p className="text-gray-600 text-sm mb-2 line-clamp-3">{description}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-900 font-medium hover:underline text-sm"
        >
          Leia mais
        </a>
      </div>
    </div>
  );
}
