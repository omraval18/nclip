import { z } from "zod";

export const billingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Valid email is required"),
  phone_number: z.string().optional(),

  country: z.string().min(2, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  street: z.string().min(1, "Street address is required"),
  zipcode: z.string().min(1, "Zipcode is required"),

  product_id: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const checkoutResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  data: z
    .object({
      subscription_id: z.string(),
      payment_id: z.string(),
      payment_link: z.string().nullable(),
      recurring_pre_tax_amount: z.number(),
      customer: z.object({
        customer_id: z.string(),
        name: z.string(),
        email: z.string(),
      }),
      metadata: z.record(z.string(), z.string()),
      addons: z.array(z.any()),
      client_secret: z.string().nullable(),
      discount_id: z.string().nullable(),
      expires_on: z.string().nullable(),
    })
    .optional(),
});

export type BillingFormData = z.output<typeof billingSchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
