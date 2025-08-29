import type { Context } from "hono";
import { createSubscription } from "@/services/payment.service";
import { createSubscription as createDbSubscription } from "@/services/subscription.service";
import {
  createSubscriptionRequestSchema,
  subscriptionApiResponseSchema,
  paymentErrorResponseSchema,
  type SubscriptionApiResponse,
  type PaymentErrorResponse,
} from "@/lib/schema";
import { getPlanFromProductId } from "@/lib/utils/credits";


export async function handleCreateCheckoutSession(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      const errorResponse: PaymentErrorResponse = {
        success: false,
        error: "Authentication required",
      };
      return c.json(errorResponse, { status: 401 });
    }

    const body = await c.req.json();
    const parsedBody = createSubscriptionRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      const errorResponse: PaymentErrorResponse = {
        success: false,
        error: `Invalid request: ${parsedBody.error.issues.map((issue) => issue.message).join(", ")}`,
      };
      const validatedError = paymentErrorResponseSchema.parse(errorResponse);
      return c.json(validatedError, { status: 400 });
    }

    const subscriptionData = await createSubscription(parsedBody.data);

    try {
      const plan = getPlanFromProductId(parsedBody.data.product_id);
      await createDbSubscription({
        subscriptionId: subscriptionData.subscription_id,
        customerId: subscriptionData.customer.customer_id,
        productId: parsedBody.data.product_id,
        paymentId: subscriptionData.payment_id,
        userId: user.id,
        plan: plan,
        quantity: parsedBody.data.quantity,
        recurringPreTaxAmount: subscriptionData.recurring_pre_tax_amount,
        currency: "USD",
        billingCountry: parsedBody.data.billing.country,
        billingState: parsedBody.data.billing.state,
        billingCity: parsedBody.data.billing.city,
        billingStreet: parsedBody.data.billing.street,
        billingZipcode: parsedBody.data.billing.zipcode,
        customerName: parsedBody.data.customer.name,
        customerEmail: parsedBody.data.customer.email,
        customerPhoneNumber: parsedBody.data.customer.phone_number,
        metadata: subscriptionData.metadata,
      });

    } catch (dbError) {
      // console.error("Error saving subscription to database:", dbError);
      throw dbError;
    }

    const response: SubscriptionApiResponse = {
      success: true,
      data: subscriptionData,
    };

    const validatedResponse = subscriptionApiResponseSchema.parse(response);
    console.log("Checkout session created successfully:", validatedResponse);
    return c.json(validatedResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    const errorResponse: PaymentErrorResponse = {
      success: false,
      error: errorMessage,
    };

    const validatedError = paymentErrorResponseSchema.parse(errorResponse);
    return c.json(validatedError, { status: 500 });
  }
}
