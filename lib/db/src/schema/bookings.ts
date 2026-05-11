import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { doulaTable } from "./doulas";

export const bookingTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  doulaId: integer("doula_id")
    .notNull()
    .references(() => doulaTable.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  serviceType: text("service_type").notNull(),
  dueDate: text("due_date"),
  status: text("status").notNull().default("pending"), // pending | accepted | declined | completed | cancelled
  message: text("message").notNull(),
  doulaResponse: text("doula_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingTable).omit({
  id: true,
  status: true,
  doulaResponse: true,
  createdAt: true,
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingTable.$inferSelect;
