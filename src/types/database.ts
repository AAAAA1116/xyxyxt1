export type Profile = {
  id: string;
  nickname: string | null;
  phone: string | null;
  created_at: string;
};

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string;
  status: "active" | "sold";
  created_at: string;
};

export type Message = {
  id: string;
  listing_id: string;
  from_user: string;
  to_user: string;
  content: string;
  is_auto: boolean;
  created_at: string;
};

export type ListingWithProfile = Listing & {
  profiles: Pick<Profile, "id" | "nickname"> | null;
};
