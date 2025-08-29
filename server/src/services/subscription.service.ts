import { db } from "@/lib/db";
import {
  UserPlan,
  getMaxCreditsForPlan,
  type UserPlan as UserPlanType,
} from "@/lib/utils/credits";

export interface CreateSubscriptionData {
  subscriptionId: string;
  customerId: string;
  productId: string;
  paymentId?: string;
  userId: string;
  plan: string;
  quantity: number;
  recurringPreTaxAmount: number;
  currency: string;
  nextBillingDate?: Date;
  previousBillingDate?: Date;
  expiresAt?: Date;
  billingCountry: string;
  billingState: string;
  billingCity: string;
  billingStreet: string;
  billingZipcode: string;
  customerName: string;
  customerEmail: string;
  customerPhoneNumber?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentData {
  paymentId: string;
  subscriptionId?: string;
  userId: string;
  customerId: string;
  amount: number;
  preAmount: number;
  tax: number;
  currency: string;
  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "REFUNDED";
  paymentMethod?: string;
  cardLastFour?: string;
  cardNetwork?: string;
  cardType?: string;
  paymentLink?: string;
  metadata?: Record<string, any>;
}

export async function createSubscription(data: CreateSubscriptionData) {
  return await db.subscription.create({
    data: {
      id: data.subscriptionId,
      subscriptionId: data.subscriptionId,
      customerId: data.customerId,
      productId: data.productId,
      paymentId: data.paymentId,
      userId: data.userId,
      plan: data.plan,
      quantity: data.quantity,
      recurringPreTaxAmount: data.recurringPreTaxAmount,
      currency: data.currency,
      status: "PENDING",
      nextBillingDate: data.nextBillingDate,
      previousBillingDate: data.previousBillingDate,
      expiresAt: data.expiresAt,
      billingCountry: data.billingCountry,
      billingState: data.billingState,
      billingCity: data.billingCity,
      billingStreet: data.billingStreet,
      billingZipcode: data.billingZipcode,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhoneNumber: data.customerPhoneNumber,
      metadata: data.metadata || {},
    },
  });
}

export async function createPayment(data: CreatePaymentData) {
  return await db.payment.create({
    data: {
      id: data.paymentId,
      paymentId: data.paymentId,
      subscriptionId: data.subscriptionId,
      userId: data.userId,
      customerId: data.customerId,
      amount: data.amount,
      preAmount: data.preAmount,
      tax: data.tax,
      currency: data.currency,
      status: data.status,
      paymentMethod: data.paymentMethod,
      cardLastFour: data.cardLastFour,
      cardNetwork: data.cardNetwork,
      cardType: data.cardType,
      paymentLink: data.paymentLink,
      metadata: data.metadata || {},
    },
  });
}

export async function getSubscriptionById(subscriptionId: string) {
  return await db.subscription.findUnique({
    where: { subscriptionId },
    include: {
      user: true,
      payments: true,
    },
  });
}

export async function getPaymentById(paymentId: string) {
  return await db.payment.findUnique({
    where: { paymentId },
    include: {
      user: true,
      subscription: true,
    },
  });
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: "PENDING" | "ACTIVE" | "ON_HOLD" | "CANCELLED" | "EXPIRED" | "FAILED",
  updates?: {
    nextBillingDate?: Date;
    previousBillingDate?: Date;
    expiresAt?: Date;
    cancelledAt?: Date;
  },
) {
  console.log("Updating subscription status:", { subscriptionId, status, updates });
  
  try {
    const updatedSubscription = await db.subscription.update({
      where: { subscriptionId },
      data: {
        status,
        ...updates,
      },
    });
    
    console.log("Successfully updated subscription status:", {
      id: updatedSubscription.subscriptionId,
      status: updatedSubscription.status,
    });
    
    return updatedSubscription;
  } catch (error) {
    console.error("Failed to update subscription status:", error);
    throw error;
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "REFUNDED",
) {
  return await db.payment.update({
    where: { paymentId },
    data: { status },
  });
}

export async function updateUserPlanAndCredits(
  userId: string,
  plan: UserPlanType,
  resetCredits = true,
) {
  const maxCredits = resetCredits ? getMaxCreditsForPlan(plan) : undefined;
  
  console.log("Updating user plan and credits:", {
    userId,
    plan,
    resetCredits,
    maxCredits,
  });

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      plan: plan,
      ...(maxCredits !== undefined && { credits: maxCredits }),
    },
  });
  
  console.log("Successfully updated user:", {
    id: updatedUser.id,
    plan: updatedUser.plan,
    credits: updatedUser.credits,
  });
  
  return updatedUser;
}

export async function getUserActiveSubscription(userId: string) {
  return await db.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUserSubscriptions(userId: string) {
  return await db.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      payments: true,
    },
  });
}

export async function findUserByCustomerId(customerId: string) {
  console.log("Looking for user by customer ID:", customerId);
  
  const subscription = await db.subscription.findFirst({
    where: { customerId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  if (subscription?.user) {
    console.log("Found user:", { id: subscription.user.id, email: subscription.user.email });
  } else {
    console.log("No user found for customer ID:", customerId);
  }

  return subscription?.user;
}

export async function findUserBySubscriptionId(subscriptionId: string) {
  console.log("Looking for user by subscription ID:", subscriptionId);
  
  const subscription = await db.subscription.findFirst({
    where: { subscriptionId },
    include: { user: true },
  });

  if (subscription?.user) {
    console.log("Found user:", { id: subscription.user.id, email: subscription.user.email });
  } else {
    console.log("No user found for subscription ID:", subscriptionId);
  }

  return subscription?.user;
}

export async function deactivateUserSubscriptions(
  userId: string,
  reason: "CANCELLED" | "EXPIRED" | "FAILED",
) {
  await db.subscription.updateMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    data: {
      status: reason,
      ...(reason === "CANCELLED" && { cancelledAt: new Date() }),
    },
  });

  await updateUserPlanAndCredits(userId, UserPlan.FREE);
}

