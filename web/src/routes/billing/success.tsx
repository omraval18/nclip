import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { CheckCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/billing/success")({
  component: BillingSuccessPage,
});

function BillingSuccessPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your payment. Your subscription has been activated successfully.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/projects">Go to Projects</Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}