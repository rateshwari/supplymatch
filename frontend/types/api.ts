export interface MatchBreakdown {
  semantic_similarity: number;
  category: number;
  location: number;
  quantity: number;
  budget: number;
  delivery: number;
  final_score: number;
}

export interface Match {
  id: string;
  requirement_id: string;
  offering_id: string;
  score: number;
  breakdown: MatchBreakdown;
  explanation: string;
  tags: string[];
  status: "pending" | "contacted" | "confirmed";
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  match_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Requirement {
  id: string;
  user_id: string;
  product: string;
  category_id: number;
  quantity: string;
  budget: string;
  location: string;
  timeline: string;
  notes?: string | null;
  created_at: string;
}

export interface CreateRequirementRequest {
  product: string;
  category_id: number;
  quantity: string;
  budget: string;
  location: string;
  timeline: string;
  notes?: string | null;
}

export interface Offering {
  id: string;
  user_id: string;
  product: string;
  category_id: number;
  quantity: string;
  price: string;
  location: string;
  delivery: string;
  notes?: string | null;
  created_at: string;
}

export interface CreateOfferingRequest {
  product: string;
  category_id: number;
  quantity: string;
  price: string;
  location: string;
  delivery: string;
  notes?: string | null;
}