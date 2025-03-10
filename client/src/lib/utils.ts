import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to calculate percentage
export function calculatePercentage(current: number, target: number): number {
  if (target === 0) return 0;
  const percentage = (current / target) * 100;
  return Math.min(Math.round(percentage), 100);
}

// Format date to readable string
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Calculate days left until deadline
export function calculateDaysLeft(deadline: Date | string): number {
  if (typeof deadline === 'string') {
    deadline = new Date(deadline);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  deadline.setHours(0, 0, 0, 0);
  
  const differenceInTime = deadline.getTime() - today.getTime();
  return Math.ceil(differenceInTime / (1000 * 3600 * 24));
}

// Format number with commas for thousands
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get progress color based on percentage
export function getProgressColor(percentage: number): string {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-amber-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}
