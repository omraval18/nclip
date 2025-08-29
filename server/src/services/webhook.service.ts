import {
  createSubscription,
  createPayment,
  updateSubscriptionStatus,
  updatePaymentStatus,
  updateUserPlanAndCredits,
  getSubscriptionById,
  getPaymentById,
  findUserByCustomerId,
  findUserBySubscriptionId,
  deactivateUserSubscriptions,
} from "@/services/subscription.service";
import {
  paymentWebhookDataSchema,
  subscriptionWebhookDataSchema,
  type WebhookPayload,
} from "@/lib/schema/webhook";
import { UserPlan, toUserPlan, getPlanFromProductId } from "@/lib/utils/credits";

function getFormattedWebhookType(type: string): string {
  return type.replace(/\./g, '_').toUpperCase();
}

export async function handlePaymentSucceeded(payload: WebhookPayload) {
  console.log("Processing payment.succeeded webhook:", payload.type);
  
  const parseResult = paymentWebhookDataSchema.safeParse(payload.data);
  if (!parseResult.success) {
    console.error("Invalid payment webhook data:", parseResult.error);
    return;
  }
  
  const data = parseResult.data;
  
  try {
    const user = await findUserByCustomerId(data.customer.customer_id);
    if (!user) {
      console.error("User not found for customer ID:", data.customer.customer_id);
      return;
    }
    
    const existingPayment = await getPaymentById(data.payment_id);
    if (existingPayment) {
      await updatePaymentStatus(data.payment_id, 'SUCCEEDED');
    } else {
      await createPayment({
        paymentId: data.payment_id,
        subscriptionId: data.subscription_id || undefined,
        userId: user.id,
        customerId: data.customer.customer_id,
        amount: data.total_amount,
        preAmount: data.settlement_amount,
        tax: data.tax || 0,
        currency: data.currency,
        status: 'SUCCEEDED',
        paymentMethod: data.payment_method,
        cardLastFour: data.card_last_four,
        cardNetwork: data.card_network,
        cardType: data.card_type,
        paymentLink: data.payment_link,
        metadata: data.metadata,
      });
    }
    
    console.log(`Payment ${data.payment_id} marked as succeeded for user ${user.id}`);
  } catch (error) {
    console.error("Error handling payment.succeeded webhook:", error);
  }
}

export async function handlePaymentFailed(payload: WebhookPayload) {
  console.log("Processing payment.failed webhook:", payload.type);
  
  const parseResult = paymentWebhookDataSchema.safeParse(payload.data);
  if (!parseResult.success) {
    console.error("Invalid payment webhook data:", parseResult.error);
    return;
  }
  
  const data = parseResult.data;
  
  try {
    const existingPayment = await getPaymentById(data.payment_id);
    if (existingPayment) {
      await updatePaymentStatus(data.payment_id, 'FAILED');
      console.log(`Payment ${data.payment_id} marked as failed`);
    }
  } catch (error) {
    console.error("Error handling payment.failed webhook:", error);
  }
}

export async function handleSubscriptionActive(payload: WebhookPayload) {
  console.log("Processing subscription.active webhook:", payload.type);
  
  const parseResult = subscriptionWebhookDataSchema.safeParse(payload.data);
  if (!parseResult.success) {
    console.error("Invalid subscription webhook data:", parseResult.error);
    return;
  }
  
  const data = parseResult.data;
  console.log("Parsed webhook data:", { 
    subscription_id: data.subscription_id, 
    customer_id: data.customer.customer_id,
    product_id: data.product_id 
  });
  
  try {
    let user = await findUserBySubscriptionId(data.subscription_id);
    if (!user) {
      console.log("User not found by subscription ID, trying customer ID");
      user = await findUserByCustomerId(data.customer.customer_id);
    }
    
    if (!user) {
      console.error("User not found for subscription ID:", data.subscription_id, "or customer ID:", data.customer.customer_id);
      return;
    }
    
    console.log("Found user:", { id: user.id, email: user.email });
    const plan = getPlanFromProductId(data.product_id);
    console.log("Mapped plan:", plan, "for product:", data.product_id);
    
    const existingSubscription = await getSubscriptionById(data.subscription_id);
    if (existingSubscription) {
      console.log("Updating existing subscription status to ACTIVE");
      await updateSubscriptionStatus(data.subscription_id, 'ACTIVE', {
        nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : undefined,
        previousBillingDate: data.previous_billing_date ? new Date(data.previous_billing_date) : undefined,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      });
    } else {
      console.log("Creating new subscription with PENDING status - will be updated to ACTIVE later");
      const newSubscription = await createSubscription({
        subscriptionId: data.subscription_id,
        customerId: data.customer.customer_id,
        productId: data.product_id,
        userId: user.id,
        plan: plan,
        quantity: data.quantity,
        recurringPreTaxAmount: data.recurring_pre_tax_amount,
        currency: data.currency,
        nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : undefined,
        previousBillingDate: data.previous_billing_date ? new Date(data.previous_billing_date) : undefined,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        billingCountry: data.billing.country,
        billingState: data.billing.state,
        billingCity: data.billing.city,
        billingStreet: data.billing.street,
        billingZipcode: data.billing.zipcode,
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        metadata: data.metadata,
      });
      
      console.log("Updating newly created subscription status to ACTIVE");
      await updateSubscriptionStatus(data.subscription_id, 'ACTIVE', {
        nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : undefined,
        previousBillingDate: data.previous_billing_date ? new Date(data.previous_billing_date) : undefined,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      });
    }
    
    console.log("Updating user plan and credits:", { userId: user.id, plan });
    try {
      await updateUserPlanAndCredits(user.id, plan, true);
      console.log(`Subscription ${data.subscription_id} activated for user ${user.id} with plan ${plan}`);
    } catch (updateError) {
      console.error("Failed to update user plan and credits:", updateError);
      console.log(`Subscription ${data.subscription_id} status updated but user plan update failed for user ${user.id}`);
      throw updateError; 
    }
  } catch (error) {
    console.error("Error handling subscription.active webhook:", error);
    throw error;
  }
}

export async function handleSubscriptionRenewed(payload: WebhookPayload) {
  console.log("Processing subscription.renewed webhook:", payload.type);
  
  const parseResult = subscriptionWebhookDataSchema.safeParse(payload.data);
  if (!parseResult.success) {
    console.error("Invalid subscription webhook data:", parseResult.error);
    return;
  }
  
  const data = parseResult.data;
  
  try {
    
    await updateSubscriptionStatus(data.subscription_id, 'ACTIVE', {
      nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : undefined,
      previousBillingDate: data.previous_billing_date ? new Date(data.previous_billing_date) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    });
    
    
    let user = await findUserBySubscriptionId(data.subscription_id);
    if (!user) {
      user = await findUserByCustomerId(data.customer.customer_id);
    }
    
    if (user) {
      const plan = getPlanFromProductId(data.product_id);
      await updateUserPlanAndCredits(user.id, plan, true);
      console.log(`Subscription ${data.subscription_id} renewed for user ${user.id}, credits refreshed`);
    } else {
      console.error("User not found for subscription renewal:", data.subscription_id);
    }
  } catch (error) {
    console.error("Error handling subscription.renewed webhook:", error);
  }
}

export async function handleSubscriptionCancelled(payload: WebhookPayload) {
  console.log("Processing subscription.cancelled webhook:", payload.type);
  
  const parseResult = subscriptionWebhookDataSchema.safeParse(payload.data);
  if (!parseResult.success) {
    console.error("Invalid subscription webhook data:", parseResult.error);
    return;
  }
  
  const data = parseResult.data;
  
  try {
    
    await updateSubscriptionStatus(data.subscription_id, 'CANCELLED', {
      cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : new Date(),
    });
    
    
    let user = await findUserBySubscriptionId(data.subscription_id);
    if (!user) {
      user = await findUserByCustomerId(data.customer.customer_id);
    }
    
    if (user) {
      await deactivateUserSubscriptions(user.id, 'CANCELLED');
      console.log(`Subscription ${data.subscription_id} cancelled for user ${user.id}, downgraded to free plan`);
    } else {
      console.error("User not found for subscription cancellation:", data.subscription_id);
    }
  } catch (error) {
    console.error("Error handling subscription.cancelled webhook:", error);
  }
}

export async function handleSubscriptionExpired(payload: WebhookPayload) {
  console.log("Processing subscription.expired webhook:", payload.type);
  
  const parseResult = subscriptionWebhookDataSchema.safeParse(payload.data);
  if (!parseResult.success) {
    console.error("Invalid subscription webhook data:", parseResult.error);
    return;
  }
  
  const data = parseResult.data;
  
  try {
    
    await updateSubscriptionStatus(data.subscription_id, 'EXPIRED');
    
    
    let user = await findUserBySubscriptionId(data.subscription_id);
    if (!user) {
      user = await findUserByCustomerId(data.customer.customer_id);
    }
    
    if (user) {
      await deactivateUserSubscriptions(user.id, 'EXPIRED');
      console.log(`Subscription ${data.subscription_id} expired for user ${user.id}, downgraded to free plan`);
    } else {
      console.error("User not found for subscription expiration:", data.subscription_id);
    }
  } catch (error) {
    console.error("Error handling subscription.expired webhook:", error);
  }
}

export async function handleSubscriptionFailed(payload: WebhookPayload) {
  console.log("Processing subscription.failed webhook:", payload.type);
  
  const parseResult = subscriptionWebhookDataSchema.safeParse(payload.data);
  if (!parseResult.success) {
    console.error("Invalid subscription webhook data:", parseResult.error);
    return;
  }
  
  const data = parseResult.data;
  
  try {
    
    await updateSubscriptionStatus(data.subscription_id, 'FAILED');
    
    
    let user = await findUserBySubscriptionId(data.subscription_id);
    if (!user) {
      user = await findUserByCustomerId(data.customer.customer_id);
    }
    
    if (user) {
      await deactivateUserSubscriptions(user.id, 'FAILED');
      console.log(`Subscription ${data.subscription_id} failed for user ${user.id}, downgraded to free plan`);
    } else {
      console.error("User not found for subscription failure:", data.subscription_id);
    }
  } catch (error) {
    console.error("Error handling subscription.failed webhook:", error);
  }
}