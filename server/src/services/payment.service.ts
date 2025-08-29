import { env } from "@/env";
import type {
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
} from "@/lib/schema";

const DODO_API_BASE =
  env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

export async function createSubscription(
  request: CreateSubscriptionRequest,
): Promise<CreateSubscriptionResponse> {
  const response = await fetch(`${DODO_API_BASE}/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
    },
    body: JSON.stringify({
      product_id: request.product_id,
      quantity: request.quantity,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        ...(request.customer.phone_number && {
          phone_number: request.customer.phone_number,
        }),
      },
      billing: {
        country: request.billing.country,
        state: request.billing.state,
        city: request.billing.city,
        street: request.billing.street,
        zipcode: request.billing.zipcode,
      },
      payment_link: request.payment_link,
      ...(request.return_url && { return_url: request.return_url }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to create subscription";

    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data as CreateSubscriptionResponse;
}

