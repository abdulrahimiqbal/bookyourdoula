import { Router, type IRouter } from "express";
import { eq, avg } from "drizzle-orm";
import { db, reviewTable, doulaTable } from "@workspace/db";
import {
  ListDoulaReviewsParams,
  CreateDoulaReviewParams,
  CreateDoulaReviewBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatReview(r: typeof reviewTable.$inferSelect) {
  return {
    ...r,
    title: r.title ?? null,
    birthYear: r.birthYear ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /doulas/:id/reviews
router.get("/doulas/:id/reviews", async (req, res): Promise<void> => {
  const params = ListDoulaReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reviews = await db
    .select()
    .from(reviewTable)
    .where(eq(reviewTable.doulaId, params.data.id))
    .orderBy(reviewTable.createdAt);

  res.json(reviews.map(formatReview));
});

// POST /doulas/:id/reviews
router.post("/doulas/:id/reviews", async (req, res): Promise<void> => {
  const params = CreateDoulaReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateDoulaReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db
    .insert(reviewTable)
    .values({
      doulaId: params.data.id,
      ...parsed.data,
    })
    .returning();

  // Recalculate average rating for the doula
  const avgResult = await db
    .select({ avg: avg(reviewTable.rating) })
    .from(reviewTable)
    .where(eq(reviewTable.doulaId, params.data.id));

  const newAvg = parseFloat(avgResult[0]?.avg ?? "0");
  const roundedAvg = Math.round(newAvg * 10) / 10;

  const allReviews = await db
    .select()
    .from(reviewTable)
    .where(eq(reviewTable.doulaId, params.data.id));

  await db
    .update(doulaTable)
    .set({
      averageRating: roundedAvg,
      reviewCount: allReviews.length,
    })
    .where(eq(doulaTable.id, params.data.id));

  res.status(201).json(formatReview(review));
});

export default router;
