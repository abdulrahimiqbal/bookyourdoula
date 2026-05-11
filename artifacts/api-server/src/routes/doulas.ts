import { Router, type IRouter } from "express";
import { eq, like, and, gte, lte, or, sql } from "drizzle-orm";
import { db, doulaTable, doulaServiceTable } from "@workspace/db";
import {
  ListDoulasQueryParams,
  GetDoulaParams,
  UpdateDoulaParams,
  UpdateDoulaBody,
  CreateDoulaBody,
  ListDoulaServicesParams,
  CreateDoulaServiceParams,
  CreateDoulaServiceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

function formatDoula(d: typeof doulaTable.$inferSelect) {
  return {
    ...d,
    serviceTypes: parseJsonArray(d.serviceTypes),
    certifications: parseJsonArray(d.certifications),
    trainings: parseJsonArray(d.trainings),
    specialties: parseJsonArray(d.specialties),
    languages: parseJsonArray(d.languages),
    createdAt: d.createdAt.toISOString(),
    averageRating: d.averageRating ?? null,
  };
}

function formatService(s: typeof doulaServiceTable.$inferSelect) {
  return {
    ...s,
    description: s.description ?? null,
    rateType: s.rateType ?? null,
    rate: s.rate ?? null,
    includedHours: s.includedHours ?? null,
    packageDetails: s.packageDetails ?? null,
  };
}

function computeCompleteness(doula: Partial<typeof doulaTable.$inferSelect> & { serviceTypes?: string; certifications?: string; languages?: string }): number {
  let score = 0;
  if (doula.name) score += 10;
  if (doula.bio && doula.bio.length > 50) score += 15;
  if (doula.tagline) score += 5;
  if (doula.photoUrl) score += 15;
  if (doula.serviceTypes && parseJsonArray(doula.serviceTypes).length > 0) score += 10;
  if (doula.yearsExperience) score += 5;
  if (doula.certifications && parseJsonArray(doula.certifications).length > 0) score += 10;
  if (doula.rateMin || doula.rateMax) score += 10;
  if (doula.languages && parseJsonArray(doula.languages).length > 0) score += 5;
  if (doula.philosophyStatement) score += 10;
  if (doula.approachDescription) score += 5;
  return Math.min(score, 100);
}

// GET /doulas - list and search
router.get("/doulas", async (req, res): Promise<void> => {
  const params = ListDoulasQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { serviceType, language, minRating, maxRate, acceptingClients, search } = params.data;

  const conditions = [];

  if (acceptingClients !== undefined) {
    conditions.push(eq(doulaTable.acceptingClients, acceptingClients));
  }

  if (maxRate !== undefined) {
    conditions.push(
      or(
        lte(doulaTable.rateMin, maxRate),
        lte(doulaTable.rateMax, maxRate),
      )
    );
  }

  if (minRating !== undefined) {
    conditions.push(gte(doulaTable.averageRating, minRating));
  }

  if (search) {
    conditions.push(
      or(
        like(doulaTable.name, `%${search}%`),
        like(doulaTable.bio, `%${search}%`),
        like(doulaTable.tagline, `%${search}%`),
      )
    );
  }

  let doulas = await db
    .select()
    .from(doulaTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(doulaTable.featured, doulaTable.averageRating);

  // Filter by serviceType and language in memory (stored as JSON strings)
  if (serviceType) {
    doulas = doulas.filter((d) => {
      const types = parseJsonArray(d.serviceTypes);
      return types.includes(serviceType) || types.includes("birth_and_postpartum");
    });
  }

  if (language) {
    doulas = doulas.filter((d) => {
      const langs = parseJsonArray(d.languages);
      return langs.some((l) => l.toLowerCase().includes(language.toLowerCase()));
    });
  }

  res.json(doulas.map(formatDoula));
});

// POST /doulas - create
router.post("/doulas", async (req, res): Promise<void> => {
  const parsed = CreateDoulaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const insertData = {
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    location: data.location,
    bio: data.bio,
    tagline: data.tagline ?? null,
    photoUrl: data.photoUrl ?? null,
    videoIntroUrl: data.videoIntroUrl ?? null,
    serviceTypes: JSON.stringify(data.serviceTypes ?? []),
    yearsExperience: data.yearsExperience ?? null,
    birthsAttended: data.birthsAttended ?? null,
    certifications: JSON.stringify(data.certifications ?? []),
    trainings: JSON.stringify(data.trainings ?? []),
    specialties: JSON.stringify(data.specialties ?? []),
    languages: JSON.stringify(data.languages ?? []),
    rateMin: data.rateMin ?? null,
    rateMax: data.rateMax ?? null,
    consultationDepositCents: data.consultationDepositCents ?? null,
    acceptingClients: data.acceptingClients ?? true,
    insuranceAccepted: data.insuranceAccepted ?? false,
    slidingScaleAvailable: data.slidingScaleAvailable ?? false,
    philosophyStatement: data.philosophyStatement ?? null,
    approachDescription: data.approachDescription ?? null,
    website: data.website ?? null,
    instagramHandle: data.instagramHandle ?? null,
  };

  const completeness = computeCompleteness(insertData);
  const [doula] = await db
    .insert(doulaTable)
    .values({ ...insertData, profileCompleteness: completeness })
    .returning();

  res.status(201).json(formatDoula(doula));
});

// GET /doulas/featured
router.get("/doulas/featured", async (_req, res): Promise<void> => {
  const doulas = await db
    .select()
    .from(doulaTable)
    .where(eq(doulaTable.featured, true))
    .orderBy(doulaTable.averageRating);

  res.json(doulas.map(formatDoula));
});

// GET /doulas/stats
router.get("/doulas/stats", async (_req, res): Promise<void> => {
  const allDoulas = await db.select().from(doulaTable);
  const totalDoulas = allDoulas.length;
  const acceptingClients = allDoulas.filter((d) => d.acceptingClients).length;
  const ratingsDoulas = allDoulas.filter((d) => d.averageRating !== null);
  const averageRating =
    ratingsDoulas.length > 0
      ? ratingsDoulas.reduce((sum, d) => sum + (d.averageRating ?? 0), 0) /
        ratingsDoulas.length
      : 0;
  const totalReviews = allDoulas.reduce((sum, d) => sum + d.reviewCount, 0);

  const bookingCount = await db.execute(sql`SELECT COUNT(*) as count FROM bookings`);
  const totalBookings = parseInt((bookingCount.rows[0] as { count: string }).count, 10) || 0;

  const birthDoulaCount = allDoulas.filter((d) => {
    const types = parseJsonArray(d.serviceTypes);
    return types.includes("birth") || types.includes("birth_and_postpartum");
  }).length;

  const postpartumDoulaCount = allDoulas.filter((d) => {
    const types = parseJsonArray(d.serviceTypes);
    return types.includes("postpartum") || types.includes("birth_and_postpartum");
  }).length;

  res.json({
    totalDoulas,
    acceptingClients,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    totalBookings,
    birthDoulaCount,
    postpartumDoulaCount,
  });
});

// GET /doulas/:id
router.get("/doulas/:id", async (req, res): Promise<void> => {
  const params = GetDoulaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doula] = await db
    .select()
    .from(doulaTable)
    .where(eq(doulaTable.id, params.data.id));

  if (!doula) {
    res.status(404).json({ error: "Doula not found" });
    return;
  }

  res.json(formatDoula(doula));
});

// PATCH /doulas/:id
router.patch("/doulas/:id", async (req, res): Promise<void> => {
  const params = UpdateDoulaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDoulaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.tagline !== undefined) updateData.tagline = data.tagline;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
  if (data.videoIntroUrl !== undefined) updateData.videoIntroUrl = data.videoIntroUrl;
  if (data.serviceTypes !== undefined) updateData.serviceTypes = JSON.stringify(data.serviceTypes);
  if (data.yearsExperience !== undefined) updateData.yearsExperience = data.yearsExperience;
  if (data.birthsAttended !== undefined) updateData.birthsAttended = data.birthsAttended;
  if (data.certifications !== undefined) updateData.certifications = JSON.stringify(data.certifications);
  if (data.trainings !== undefined) updateData.trainings = JSON.stringify(data.trainings);
  if (data.specialties !== undefined) updateData.specialties = JSON.stringify(data.specialties);
  if (data.languages !== undefined) updateData.languages = JSON.stringify(data.languages);
  if (data.rateMin !== undefined) updateData.rateMin = data.rateMin;
  if (data.rateMax !== undefined) updateData.rateMax = data.rateMax;
  if (data.consultationDepositCents !== undefined) updateData.consultationDepositCents = data.consultationDepositCents;
  if (data.acceptingClients !== undefined) updateData.acceptingClients = data.acceptingClients;
  if (data.insuranceAccepted !== undefined) updateData.insuranceAccepted = data.insuranceAccepted;
  if (data.slidingScaleAvailable !== undefined) updateData.slidingScaleAvailable = data.slidingScaleAvailable;
  if (data.philosophyStatement !== undefined) updateData.philosophyStatement = data.philosophyStatement;
  if (data.approachDescription !== undefined) updateData.approachDescription = data.approachDescription;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.instagramHandle !== undefined) updateData.instagramHandle = data.instagramHandle;
  if (data.featured !== undefined) updateData.featured = data.featured;

  // Recalculate completeness
  const [existing] = await db.select().from(doulaTable).where(eq(doulaTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Doula not found" });
    return;
  }
  const merged = { ...existing, ...updateData };
  updateData.profileCompleteness = computeCompleteness(merged as typeof doulaTable.$inferSelect);

  const [doula] = await db
    .update(doulaTable)
    .set(updateData)
    .where(eq(doulaTable.id, params.data.id))
    .returning();

  res.json(formatDoula(doula));
});

// GET /doulas/:id/services
router.get("/doulas/:id/services", async (req, res): Promise<void> => {
  const params = ListDoulaServicesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const services = await db
    .select()
    .from(doulaServiceTable)
    .where(eq(doulaServiceTable.doulaId, params.data.id));

  res.json(services.map(formatService));
});

// POST /doulas/:id/services
router.post("/doulas/:id/services", async (req, res): Promise<void> => {
  const params = CreateDoulaServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateDoulaServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [service] = await db
    .insert(doulaServiceTable)
    .values({
      doulaId: params.data.id,
      ...parsed.data,
    })
    .returning();

  res.status(201).json(formatService(service));
});

export default router;
