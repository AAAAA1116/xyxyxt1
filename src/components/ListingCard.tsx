import Link from "next/link";
import Image from "next/image";
import type { ListingWithProfile } from "@/types/database";

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return "刚刚";
  if (diffM < 60) return `${diffM}分钟前`;
  if (diffH < 24) return `${diffH}小时前`;
  if (diffD < 7) return `${diffD}天前`;
  return d.toLocaleDateString("zh-CN");
}

export function ListingCard({ listing }: { listing: ListingWithProfile }) {
  return (
    <Link href={`/listing/${listing.id}`} className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-gray-100">
        <Image
          src={listing.image_url}
          alt={listing.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 200px"
        />
      </div>
      <div className="p-3">
        <p className="font-medium text-gray-900 truncate">{listing.title}</p>
        <p className="text-indigo-600 font-semibold mt-1">¥{listing.price}</p>
        <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(listing.created_at)}</p>
      </div>
    </Link>
  );
}
