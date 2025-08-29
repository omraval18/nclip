import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { billingSchema, type BillingFormData } from "../lib/schema/billing";
import { useCreateCheckoutSession } from "../hooks/use-billing";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "./ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { toast } from "sonner";

interface BillingFormProps {
    productId: string;
    onSuccess?: () => void;
}

const countries = [
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "GB", label: "United Kingdom" },
    { value: "AU", label: "Australia" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "IN", label: "India" },
];

export function BillingForm({ productId, onSuccess }: BillingFormProps) {
    const createCheckoutMutation = useCreateCheckoutSession();

    const form = useForm<BillingFormData>({
        resolver: zodResolver(billingSchema),
        defaultValues: {
            product_id: productId,
            quantity: 1,
            name: "",
            email: "",
            phone_number: "",
            country: "",
            state: "",
            city: "",
            zipcode: "",
            street: "",
        },
    });

    const onSubmit = async (data: BillingFormData) => {
        createCheckoutMutation.mutate(data, {
            onSuccess: (result) => {
                console.log("Checkout session result:", result);
                if (result.payment_link) {
                    window.location.href = result.payment_link;
                    onSuccess?.();
                } else {
                    toast.error("Failed to create checkout session");
                }
            },
            onError: (error) => {
                console.error("Checkout error:", error);
                toast.error(
                    error instanceof Error ? error.message : "Failed to create checkout session"
                );
            },
        });
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <section className="space-y-5">
                            <h3 className=" font-cal font-medium">Customer Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-cal font-medium text-xs">
                                                Full Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-cal text-xs">
                                                Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="phone_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-cal font-medium text-xs">
                                            Phone Number
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1 (555) 123-4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </section>

                        <section className="space-y-5">
                            <h3 className=" font-medium">Address</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-cal font-medium text-xs">
                                                Country
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Country" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {countries.map((country) => (
                                                        <SelectItem
                                                            key={country.value}
                                                            value={country.value}
                                                        >
                                                            {country.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-cal font-medium text-xs">
                                                State/Province
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="California" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-cal font-medium text-xs">
                                                City
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="San Francisco" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="zipcode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-cal font-medium text-xs">
                                                ZIP/Postal Code
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="94102" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="street"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-cal font-medium text-xs">
                                            Street Address
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="123 Main Street, Apt 4B"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </section>

                        <Button
                            type="submit"
                            className="w-full text-sm font-medium font-cal"
                            disabled={createCheckoutMutation.isPending}
                        >
                            {createCheckoutMutation.isPending
                                ? "Creating Checkout Session..."
                                : "Continue to Payment"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}