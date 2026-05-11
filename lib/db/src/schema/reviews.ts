import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { doulaTable } from "./doulas";

export const reviewTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  doulaId: integer("doula_id")
    .notNull()
    .references(() => doulaTable.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body").notNull(),
  serviceType: text("service_type").notNull(),
  birthYear: integer("birth_year"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewTable).omit({
  id: true,
  createdAt: true,
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewTable.$inferSelect;
