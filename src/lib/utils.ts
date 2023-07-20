import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

export function formatPrice(
  price: number,
  currency: "USD" | "EUR" | "GBP" | "JPY" | "RUB" | "CNY" | "BDT" = "USD"
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}
