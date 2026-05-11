import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingTable, reviewTable, doulaTable } from "@workspace/db";
import { GetDoulasDashboardParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /doulas/:id/dashboard
router.get("/doulas/:id/dashboard", async (req, res): Promise<void> => {
  const params = GetDoulasDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { id } = params.data;

  const [doula] = await db
    .select()
    .from(doulaTable)
    .where(eq(doulaTable.id, id));

  if (!doula) {
    res.status(404).json({ error: "Doula not found" });
    return;
  }

  const allBookings = await db
    .select()
    .from(bookingTable)
    .where(eq(bookingTable.doulaId, id))
    .orderBy(bookingTable.createdAt);

  const allReviews = await db
    .select()
    .from(reviewTable)
    .where(eq(reviewTable.doulaId, id))
    .orderBy(reviewTable.createdAt);

  const pendingBookings = allBookings.filter((b) => b.status === "pending").length;
  const acceptedBookings = allBookings.filter((b) => b.status === "accepted").length;
  const completedBookings = allBookings.filter((b) => b.status === "completed").length;

  const recentBookings = allBookings
    .slice(-5)
    .reverse()
    .map((b) => ({
      ...b,
      doulaName: doula.name,
      clientPhone: b.clientPhone ?? null,
      dueDate: b.dueDate ?? null,
      doulaResponse: b.doulaResponse ?? null,
      createdAt: b.createdAt.toISOString(),
    }));

  const recentReviews = allReviews
    .slice(-5)
    .reverse()
    .map((r) => ({
      ...r,
      title: r.title ?? null,
      birthYear: r.birthYear ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

  res.json({
    doulaId: id,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    totalReviews: allReviews.length,
    averageRating: doula.averageRating ?? null,
    profileCompleteness: doula.profileCompleteness,
    recentBookings,
    recentReviews,
  });
});

export default router;
