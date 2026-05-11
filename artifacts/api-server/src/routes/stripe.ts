import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingTable, doulaTable } from "@workspace/db";
import { getStripeClient } from "../stripeClient";

const router: IRouter = Router();

// POST /stripe/checkout
// Creates a Stripe Checkout session for a booking deposit
router.post("/stripe/checkout", async (req, res): Promise<void> => {
  const { bookingId, successUrl, cancelUrl } = req.body as {
    bookingId: number;
    successUrl: string;
    cancelUrl: string;
  };

  if (!bookingId || !successUrl || !cancelUrl) {
    res.status(400).json({ error: "bookingId, successUrl and cancelUrl are required" });
    return;
  }

  const result = await db
    .select({ booking: bookingTable, doulaName: doulaTable.name, depositCents: doulaTable.consultationDepositCents })
    .from(bookingTable)
    .leftJoin(doulaTable, eq(bookingTable.doulaId, doulaTable.id))
    .where(eq(bookingTable.id, bookingId));

  if (!result[0]) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const { booking, doulaName, depositCents } = result[0];
  const amountCents = depositCents ?? 7500; // default $75 CAD

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: `Consultation deposit — ${doulaName ?? "Doula"}`,
            description: `Refundable deposit for your ${booking.serviceType} consultation request`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
    cancel_url: `${cancelUrl}?booking_id=${bookingId}`,
    metadata: {
      bookingId: String(bookingId),
    },
  });

  // Save the session ID and update status to pending_payment
  await db
    .update(bookingTable)
    .set({
      stripeSessionId: session.id,
      depositAmountCents: amountCents,
      status: "pending_payment",
    })
    .where(eq(bookingTable.id, bookingId));

  res.json({ checkoutUrl: session.url!, sessionId: session.id });
});

export default router;
