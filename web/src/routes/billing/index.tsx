import { createFileRoute } from "@tanstack/react-router";
import { BillingForm } from "../../components/billing-form";
import { z } from "zod";

const billingSearchSchema = z.object({
  productId: z.string().optional(),
});

export const Route = createFileRoute("/billing/")({
  component: BillingPage,
  validateSearch: billingSearchSchema,
});

function BillingPage() {
  const { productId } = Route.useSearch();
  const finalProductId = productId || "prod_example_123";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-xl font-cal mb-2">Billing Information</h1>
        <p className="text-muted-foreground text-sm">
          Complete your billing information to continue with your subscription
        </p>
      </div>

      <BillingForm productId={finalProductId} />
    </div>
  );
}

