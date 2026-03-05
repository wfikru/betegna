// Type declarations for Firestore entities

export interface Task {
  id?: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  location?: string;
  city?: string;
  date_needed?: string;
  time_preference?: string;
  status?: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  created_by: string;
  created_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  poster_name?: string;
  image_url?: string;
}

export interface TaskOffer {
  id?: string;
  task_id: string;
  task_title?: string;
  tasker_email?: string;
  tasker_name?: string;
  price: number;
  message: string;
  estimated_hours?: number;
  status?: "pending" | "accepted" | "rejected" | "withdrawn";
  created_date?: string;
}

export interface Review {
  id?: string;
  task_id: string;
  reviewer_email?: string;
  reviewer_name?: string;
  reviewee_email: string;
  rating: number;
  comment?: string;
  created_date?: string;
}

export interface User {
  uid?: string;
  email: string;
  full_name?: string;
  bio?: string;
  phone?: string;
  city?: string;
  is_tasker?: boolean;
  skills?: string[];
  hourly_rate?: number;
  created_date?: string;
}
