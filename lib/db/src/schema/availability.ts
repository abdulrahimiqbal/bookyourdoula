import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { doulaTable } from "./doulas";

export const doulaAvailabilityTable = pgTable("doula_availability", {
  id: serial("id").primaryKey(),
  doulaId: integer("doula_id")
    .notNull()
    .references(() => doulaTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  available: boolean("available").notNull().default(true),
});

export const insertAvailabilitySchema = createInsertSchema(
  doulaAvailabilityTable
).omit({ id: true });
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type DoulaAvailability = typeof doulaAvailabilityTable.$inferSelect;
