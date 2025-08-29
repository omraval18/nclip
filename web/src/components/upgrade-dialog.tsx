import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Crown, Check } from "lucide-react";

interface UpgradeDialogProps {
  trigger?: React.ReactNode;
}

const plans = [
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Perfect for individual creators",
    features: [
      "Everything in Free",
      "20 Video Credits",
      "Upload Higher Quality Videos (upto 4GB)",
      "Priority support",
      "Upto 5 Projects",
    ],
    productId: "pdt_KJ8qkzP8nxQhQMXxUXR3I",
    popular: true,
  },
  {
    name: "Max",
    price: "$39",
    period: "/month",
    description: "Great for teams and agencies",
    features: [
      "Everything in Pro",
      "Upload 4K Videos (upto 20GB)",
      "Unlimited Projects",
      "100 Video Credits",
      "Priority support",
    ],
    productId: "prod_team_monthly_123",
    popular: false,
  },
];

export function UpgradeDialog({ trigger }: UpgradeDialogProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button className="gap-2 text-xs" size={"sm"}>
      <Crown className="size-3" />
      Upgrade
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Unlock the full potential of nclip with our premium features
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-baseline justify-center gap-1 mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => setOpen(false)}
                >
                  <Link to="/billing" search={{ productId: plan.productId }}>
                    Upgrade to {plan.name}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
