import { z } from "zod";

export const webhookPayloadSchema = z.object({
  business_id: z.string(),
  data: z.record(z.any(), z.any()),
  timestamp: z.string(),
  type: z.string(),
});

export const paymentWebhookDataSchema = z.object({
  payment_id: z.string(),
  subscription_id: z.string().nullable().optional(),
  customer: z.object({
    customer_id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  billing: z.object({
    city: z.string(),
    country: z.string(),
    state: z.string(),
    street: z.string(),
    zipcode: z.string(),
  }),
  currency: z.string(),
  total_amount: z.number(),
  settlement_amount: z.number(),
  settlement_currency: z.string().optional(),
  settlement_tax: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  status: z.enum(["succeeded", "failed", "processing", "cancelled"]),
  payment_method: z.string().optional(),
  payment_method_type: z.string().nullable().optional(),
  card_last_four: z.string().optional(),
  card_network: z.string().optional(),
  card_type: z.string().optional(),
  card_issuing_country: z.string().optional(),
  payment_link: z.string().optional(),
  created_at: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? val : val.toISOString()
  ),
  updated_at: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : typeof val === 'string' ? val : val.toISOString()
  ).optional(),
  metadata: z.record(z.any(), z.any()).default({}),
  error_code: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  brand_id: z.string().optional(),
  business_id: z.string().optional(),
  digital_products_delivered: z.boolean().optional(),
  discount_id: z.string().nullable().optional(),
  disputes: z.array(z.any()).optional(),
  refunds: z.array(z.any()).optional(),
  product_cart: z.array(z.object({
    product_id: z.string(),
    quantity: z.number(),
  })).nullable().optional(),
});

export const subscriptionWebhookDataSchema = z.object({
  subscription_id: z.string(),
  customer: z.object({
    customer_id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  billing: z.object({
    city: z.string(),
    country: z.string(),
    state: z.string(),
    street: z.string(),
    zipcode: z.string(),
  }),
  product_id: z.string(),
  quantity: z.number(),
  currency: z.string(),
  recurring_pre_tax_amount: z.number(),
  status: z.enum(["active", "cancelled", "expired", "failed", "on_hold"]),
  next_billing_date: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? val : val.toISOString()
  ).optional(),
  previous_billing_date: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? val : val.toISOString()
  ).optional(),
  expires_at: z.string().optional(),
  cancelled_at: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : typeof val === 'string' ? val : val.toISOString()
  ).optional(),
  created_at: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? val : val.toISOString()
  ),
  metadata: z.record(z.any(), z.any()).default({}),
  addons: z.array(z.any()).optional(),
  cancel_at_next_billing_date: z.boolean().optional(),
  discount_id: z.string().nullable().optional(),
  on_demand: z.boolean().optional(),
  payload_type: z.string().optional(),
  payment_frequency_count: z.number().optional(),
  payment_frequency_interval: z.string().optional(),
  subscription_period_count: z.number().optional(),
  subscription_period_interval: z.string().optional(),
  tax_inclusive: z.boolean().optional(),
  trial_period_days: z.number().optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type PaymentWebhookData = z.infer<typeof paymentWebhookDataSchema>;
export type SubscriptionWebhookData = z.infer<
  typeof subscriptionWebhookDataSchema
>;

