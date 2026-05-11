import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { eq } from "drizzle-orm";
import { db, bookingTable } from "@workspace/db";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Stripe webhook MUST be registered BEFORE express.json() so the body stays as a raw Buffer
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }

    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeWebhookSecret) {
      logger.warn("STRIPE_WEBHOOK_SECRET not set — skipping webhook verification");
      res.status(200).json({ received: true });
      return;
    }

    try {
      const { default: Stripe } = await import("stripe");
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

      const stripe = new Stripe(stripeKey);
      const sig = Array.isArray(signature) ? signature[0] : signature;
      const event = stripe.webhooks.constructEvent(req.body as Buffer, sig, stripeWebhookSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as { metadata?: { bookingId?: string }; payment_intent?: string };
        const bookingId = session.metadata?.bookingId ? parseInt(session.metadata.bookingId, 10) : null;
        if (bookingId) {
          await db
            .update(bookingTable)
            .set({
              depositPaid: true,
              status: "pending",
              stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            })
            .where(eq(bookingTable.id, bookingId));
          logger.info({ bookingId }, "Booking deposit confirmed via webhook");
        }
      }

      res.status(200).json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webhook error";
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: message });
    }
  }
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
