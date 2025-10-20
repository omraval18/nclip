import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  className?: string;
}

export default function SignUpForm({
  onSwitchToSignIn,
  className,
  ...props
}: SignUpFormProps & React.ComponentProps<"div">) {
  const navigate = useNavigate({
    from: "/login",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/",
            });
            // toast.success("Sign up successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 w-full justify-center items-center",
        className,
      )}
      {...props}
    >
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-6">
              <form.Field name="name">
                {(field) => (
                  <div className="grid gap-3">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="John Doe"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-sm text-red-500">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <div className="grid gap-3">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      placeholder="m@example.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-sm text-red-500">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <div className="grid gap-3">
                    <Label htmlFor={field.name}>Password</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-sm text-red-500">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Subscribe>
                {(state) => (
                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!state.canSubmit || state.isSubmitting}
                    >
                      {state.isSubmitting
                        ? "Creating Account..."
                        : "Create Account"}
                    </Button>
                    <Button variant="outline" className="w-full" type="button">
                      Sign up with Google
                    </Button>
                  </div>
                )}
              </form.Subscribe>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

