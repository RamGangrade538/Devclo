export type Role = "CUSTOMER" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  imageUrl: string | null;
  active: boolean;
  categoryId: string | null;
  category?: Category | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
