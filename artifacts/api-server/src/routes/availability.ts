import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, doulaAvailabilityTable } from "@workspace/db";

const router: IRouter = Router();

// GET /doulas/:id/availability?year=2026&month=5
router.get("/doulas/:id/availability", async (req, res): Promise<void> => {
  const doulaId = parseInt(req.params.id, 10);
  if (isNaN(doulaId)) {
    res.status(400).json({ error: "Invalid doula id" });
    return;
  }

  const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : new Date().getMonth() + 1;

  const paddedMonth = String(month).padStart(2, "0");
  const startDate = `${year}-${paddedMonth}-01`;
  // Last day of the month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`;

  const entries = await db
    .select()
    .from(doulaAvailabilityTable)
    .where(
      and(
        eq(doulaAvailabilityTable.doulaId, doulaId),
        gte(doulaAvailabilityTable.date, startDate),
        lte(doulaAvailabilityTable.date, endDate)
      )
    )
    .orderBy(doulaAvailabilityTable.date);

  res.json(entries);
});

// PUT /doulas/:id/availability
router.put("/doulas/:id/availability", async (req, res): Promise<void> => {
  const doulaId = parseInt(req.params.id, 10);
  if (isNaN(doulaId)) {
    res.status(400).json({ error: "Invalid doula id" });
    return;
  }

  const { dates } = req.body as {
    dates: Array<{ date: string; available: boolean }>;
  };

  if (!Array.isArray(dates)) {
    res.status(400).json({ error: "dates must be an array" });
    return;
  }

  const results: typeof doulaAvailabilityTable.$inferSelect[] = [];

  for (const { date, available } of dates) {
    if (!date || typeof available !== "boolean") continue;

    // Upsert: delete then insert
    await db
      .delete(doulaAvailabilityTable)
      .where(
        and(
          eq(doulaAvailabilityTable.doulaId, doulaId),
          eq(doulaAvailabilityTable.date, date)
        )
      );

    if (available) {
      const [entry] = await db
        .insert(doulaAvailabilityTable)
        .values({ doulaId, date, available: true })
        .returning();
      if (entry) results.push(entry);
    }
  }

  // Return the full availability for the affected months
  const uniqueDates = dates.map((d) => d.date).sort();
  if (uniqueDates.length === 0) {
    res.json([]);
    return;
  }

  const startDate = uniqueDates[0];
  const endDate = uniqueDates[uniqueDates.length - 1];

  const allEntries = await db
    .select()
    .from(doulaAvailabilityTable)
    .where(
      and(
        eq(doulaAvailabilityTable.doulaId, doulaId),
        gte(doulaAvailabilityTable.date, startDate),
        lte(doulaAvailabilityTable.date, endDate)
      )
    )
    .orderBy(doulaAvailabilityTable.date);

  res.json(allEntries);
});

export default router;
