import type { BillingFormData, CheckoutResponse } from "../schema/billing";
import { checkoutResponseSchema } from "../schema/billing";

const BASE_API = import.meta.env.BASE_API

export const createCheckoutSession = async (
  data: BillingFormData,
): Promise<{ payment_link: string }> => {
  const response = await fetch(`${BASE_API}/api/payments/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      product_id: data.product_id,
      quantity: data.quantity,
      customer: {
        name: data.name,
        email: data.email,
        ...(data.phone_number && { phone_number: data.phone_number }),
      },
      billing: {
        country: data.country,
        state: data.state,
        city: data.city,
        street: data.street,
        zipcode: data.zipcode,
      },
      payment_link: true,
      return_url: `${window.location.origin}/billing/success`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `Failed to create checkout session: ${response.statusText}`,
    );
  }

  const result: CheckoutResponse = await response.json();
  const validatedResult = checkoutResponseSchema.parse(result);

  if (!validatedResult.success) {
    throw new Error(
      validatedResult.error || "Failed to create checkout session",
    );
  }

  if (!validatedResult.data?.payment_link) {
    throw new Error("No payment link received from server");
  }

  return { payment_link: validatedResult.data.payment_link };
};
