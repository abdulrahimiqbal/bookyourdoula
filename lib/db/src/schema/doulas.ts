import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doulaTable = pgTable("doulas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  location: text("location").notNull().default("Ottawa, ON"),
  bio: text("bio").notNull(),
  tagline: text("tagline"),
  photoUrl: text("photo_url"),
  videoIntroUrl: text("video_intro_url"),
  serviceTypes: text("service_types").notNull().default("[]"), // JSON array
  yearsExperience: integer("years_experience"),
  birthsAttended: integer("births_attended"),
  certifications: text("certifications").notNull().default("[]"), // JSON array
  trainings: text("trainings").notNull().default("[]"), // JSON array
  specialties: text("specialties").notNull().default("[]"), // JSON array
  languages: text("languages").notNull().default("[]"), // JSON array
  rateMin: integer("rate_min"),
  rateMax: integer("rate_max"),
  consultationDepositCents: integer("consultation_deposit_cents"), // null = no deposit required
  acceptingClients: boolean("accepting_clients").notNull().default(true),
  insuranceAccepted: boolean("insurance_accepted").notNull().default(false),
  slidingScaleAvailable: boolean("sliding_scale_available")
    .notNull()
    .default(false),
  averageRating: real("average_rating"),
  reviewCount: integer("review_count").notNull().default(0),
  profileCompleteness: integer("profile_completeness").notNull().default(0),
  philosophyStatement: text("philosophy_statement"),
  approachDescription: text("approach_description"),
  website: text("website"),
  instagramHandle: text("instagram_handle"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDoulaSchema = createInsertSchema(doulaTable).omit({
  id: true,
  reviewCount: true,
  profileCompleteness: true,
  createdAt: true,
});
export type InsertDoula = z.infer<typeof insertDoulaSchema>;
export type Doula = typeof doulaTable.$inferSelect;

export const doulaServiceTable = pgTable("doula_services", {
  id: serial("id").primaryKey(),
  doulaId: integer("doula_id")
    .notNull()
    .references(() => doulaTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  serviceType: text("service_type").notNull().default("birth"), // birth | postpartum | education | other
  rateType: text("rate_type"), // flat | hourly | package
  rate: integer("rate"),
  includedHours: integer("included_hours"),
  packageDetails: text("package_details"),
});

export const insertDoulaServiceSchema = createInsertSchema(
  doulaServiceTable
).omit({ id: true });
export type InsertDoulaService = z.infer<typeof insertDoulaServiceSchema>;
export type DoulaService = typeof doulaServiceTable.$inferSelect;
