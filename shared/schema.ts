import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  description: text("description").notNull(),
  targetValue: doublePrecision("target_value").notNull(),
  currentValue: doublePrecision("current_value").default(0).notNull(),
  unit: text("unit").notNull(),
  deadline: timestamp("deadline").notNull(),
  categoryId: integer("category_id"),
  completed: boolean("completed").default(false).notNull(),
  reminderFrequency: text("reminder_frequency").default("none").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progressLogs = pgTable("progress_logs", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  value: doublePrecision("value").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
});

export const actionItems = pgTable("action_items", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  description: text("description").notNull(),
  completed: boolean("completed").default(false).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCategorySchema = createInsertSchema(categories);

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  currentValue: true,
  completed: true,
  createdAt: true,
});

export const insertProgressLogSchema = createInsertSchema(progressLogs).omit({
  id: true,
  date: true,
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({
  id: true,
  completed: true,
  date: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  achievedAt: true,
});

// Zod types for frontend validation
export const goalFormSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  targetValue: z.number().positive("Target value must be positive"),
  unit: z.string().min(1, "Unit is required"),
  deadline: z.date(),
  categoryId: z.number().optional(),
  reminderFrequency: z.enum(["daily", "weekly", "none"]),
});

export const progressLogFormSchema = z.object({
  goalId: z.number(),
  value: z.number().positive("Progress value must be positive"),
  notes: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type ProgressLog = typeof progressLogs.$inferSelect;
export type InsertProgressLog = z.infer<typeof insertProgressLogSchema>;

export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type GoalWithCategory = Goal & { category?: Category };

export type DashboardStats = {
  activeGoals: number;
  completedGoals: number;
  pointsEarned: number;
};
