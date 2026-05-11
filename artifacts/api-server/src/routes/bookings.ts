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
    preferredDate: b.preferredDate ?? null,
    doulaResponse: b.doulaResponse ?? null,
    stripeSessionId: b.stripeSessionId ?? null,
    depositAmountCents: b.depositAmountCents ?? null,
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

// POST /bookings - creates booking and optionally a Stripe checkout session
router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Get the doula to check if deposit is required
  const [doula] = await db
    .select({ name: doulaTable.name, depositCents: doulaTable.consultationDepositCents })
    .from(doulaTable)
    .where(eq(doulaTable.id, parsed.data.doulaId));

  const depositRequired = doula?.depositCents != null && doula.depositCents > 0;

  const [booking] = await db
    .insert(bookingTable)
    .values({
      ...parsed.data,
      clientPhone: parsed.data.clientPhone ?? null,
      dueDate: parsed.data.dueDate ?? null,
      preferredDate: parsed.data.preferredDate ?? null,
      status: depositRequired ? "pending_payment" : "pending",
      depositAmountCents: doula?.depositCents ?? null,
    })
    .returning();

  let checkoutUrl: string | null = null;

  if (depositRequired && process.env.STRIPE_SECRET_KEY) {
    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const host = req.get("host") ?? "";
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "cad",
              product_data: {
                name: `Consultation deposit — ${doula.name}`,
                description: `Refundable deposit for your ${booking.serviceType} consultation request`,
              },
              unit_amount: doula.depositCents!,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
        cancel_url: `${baseUrl}/doulas/${booking.doulaId}/book?cancelled=1`,
        metadata: { bookingId: String(booking.id) },
      });

      await db
        .update(bookingTable)
        .set({ stripeSessionId: session.id })
        .where(eq(bookingTable.id, booking.id));

      checkoutUrl = session.url;
    } catch (err) {
      req.log.error({ err }, "Failed to create Stripe checkout session");
    }
  }

  res.status(201).json({
    booking: formatBooking(booking, doula?.name),
    checkoutUrl,
  });
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
