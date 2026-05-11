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
  preferredDate: text("preferred_date"), // YYYY-MM-DD
  status: text("status").notNull().default("pending"), // pending | pending_payment | accepted | declined | completed | cancelled
  message: text("message").notNull(),
  doulaResponse: text("doula_response"),
  // Stripe payment fields
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  depositAmountCents: integer("deposit_amount_cents"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingTable).omit({
  id: true,
  status: true,
  doulaResponse: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  depositPaid: true,
  depositAmountCents: true,
  createdAt: true,
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingTable.$inferSelect;
