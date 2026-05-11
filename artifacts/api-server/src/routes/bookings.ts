import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, bookingTable, doulaTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  CreateBookingBody,
  GetBookingParams,
  UpdateBookingParams,
  UpdateBookingBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatBooking(
  b: typeof bookingTable.$inferSelect,
  doulaName?: string | null
) {
  return {
    ...b,
    doulaName: doulaName ?? null,
    clientPhone: b.clientPhone ?? null,
    dueDate: b.dueDate ?? null,
    doulaResponse: b.doulaResponse ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}

// GET /bookings
router.get("/bookings", async (req, res): Promise<void> => {
  const params = ListBookingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.doulaId !== undefined) {
    conditions.push(eq(bookingTable.doulaId, params.data.doulaId));
  }
  if (params.data.status !== undefined) {
    conditions.push(eq(bookingTable.status, params.data.status));
  }

  const bookings = await db
    .select({
      booking: bookingTable,
      doulaName: doulaTable.name,
    })
    .from(bookingTable)
    .leftJoin(doulaTable, eq(bookingTable.doulaId, doulaTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(bookingTable.createdAt);

  res.json(
    bookings.map(({ booking, doulaName }) => formatBooking(booking, doulaName))
  );
});

// POST /bookings
router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .insert(bookingTable)
    .values({
      ...parsed.data,
      clientPhone: parsed.data.clientPhone ?? null,
      dueDate: parsed.data.dueDate ?? null,
    })
    .returning();

  // Fetch doula name
  const [doula] = await db
    .select({ name: doulaTable.name })
    .from(doulaTable)
    .where(eq(doulaTable.id, parsed.data.doulaId));

  res.status(201).json(formatBooking(booking, doula?.name));
});

// GET /bookings/:id
router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await db
    .select({
      booking: bookingTable,
      doulaName: doulaTable.name,
    })
    .from(bookingTable)
    .leftJoin(doulaTable, eq(bookingTable.doulaId, doulaTable.id))
    .where(eq(bookingTable.id, params.data.id));

  if (!result[0]) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(formatBooking(result[0].booking, result[0].doulaName));
});

// PATCH /bookings/:id
router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.doulaResponse !== undefined)
    updateData.doulaResponse = parsed.data.doulaResponse;

  const [booking] = await db
    .update(bookingTable)
    .set(updateData)
    .where(eq(bookingTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [doula] = await db
    .select({ name: doulaTable.name })
    .from(doulaTable)
    .where(eq(doulaTable.id, booking.doulaId));

  res.json(formatBooking(booking, doula?.name));
});

export default router;
