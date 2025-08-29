import { useMutation } from "@tanstack/react-query";
import { createCheckoutSession } from "@/lib/api/billing";
import type { BillingFormData } from "@/lib/schema/billing";

interface CheckoutResponse {
  payment_link: string;
}

export function useCreateCheckoutSession() {
  return useMutation<CheckoutResponse, Error, BillingFormData>({
    mutationFn: createCheckoutSession,
    onError: (error) => {
      console.error('Failed to create checkout session:', error);
    }
  });
}