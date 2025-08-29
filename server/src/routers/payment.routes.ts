import { Hono } from "hono";
import { Webhooks } from "@dodopayments/hono";
import { env } from "../env";
import type { AuthType } from "../lib/auth";
import { handleCreateCheckoutSession } from "../controllers/payment.controller";
import {
  handlePaymentSucceeded,
  handlePaymentFailed,
  handleSubscriptionActive,
  handleSubscriptionRenewed,
  handleSubscriptionCancelled,
  handleSubscriptionExpired,
  handleSubscriptionFailed,
} from "../services/webhook.service";

const paymentRoutes = new Hono<{
  Variables: AuthType;
}>();

paymentRoutes.post("/checkout", handleCreateCheckoutSession);

paymentRoutes.post(
  "/webhooks",
  Webhooks({
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY!,
    onPayload: async (payload) => {
      console.log("Webhook payload received:", payload);
    },
    onPaymentSucceeded: async (payload) => {
      await handlePaymentSucceeded(payload);
    },
    onPaymentFailed: async (payload) => {
      await handlePaymentFailed(payload);
    },
    onSubscriptionActive: async (payload) => {
      await handleSubscriptionActive(payload);
    },
    onSubscriptionRenewed: async (payload) => {
      await handleSubscriptionRenewed(payload);
    },
    onSubscriptionCancelled: async (payload) => {
      await handleSubscriptionCancelled(payload);
    },
    onSubscriptionExpired: async (payload) => {
      await handleSubscriptionExpired(payload);
    },
    onSubscriptionFailed: async (payload) => {
      await handleSubscriptionFailed(payload);
    },
  }),
);

export { paymentRoutes };
