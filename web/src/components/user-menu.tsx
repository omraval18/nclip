
import React from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

import {
  CreditCardIcon,
  NotificationIcon,
  SignOutIcon,
  UserIcon,
  CoinIcon,
} from "@phosphor-icons/react";
import { getPlanDisplayName, toUserPlan, UserPlan } from "@/lib/utils/credits";

export default function UserMenu({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const currentUser = session?.user;
  const plan = currentUser?.plan
  const planEnum = plan ? toUserPlan(plan) : UserPlan.FREE;


  if (isPending) {
    return (
      <div className={className}>
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={className}>
        <Button variant="outline" asChild>
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="size-7 rounded-full"
            aria-label="Open user menu"
            title={currentUser.name ?? "Account"}
          >
            <UserIcon className="size-3.5" weight="bold" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="min-w-56 rounded-lg bg-card" side="bottom" align="end" sideOffset={8}>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={currentUser.image || ""} alt={currentUser.name || "User"} />
                <AvatarFallback className="rounded-lg">
                  {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : "UN"}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">{currentUser.name}</span>
                <span className="text-muted-foreground truncate text-xs">{currentUser.email}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {getPlanDisplayName(planEnum)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CoinIcon className="size-3" />
                    <span>{currentUser.credits || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => navigate({ to: "/" })}>
              <UserIcon className="mr-2" />
              Account
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => navigate({ to: "/" })}>
              <CreditCardIcon className="mr-2" />
              Billing
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => navigate({ to: "/" })}>
              <NotificationIcon className="mr-2" />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <button
              className="w-full flex items-center gap-2 text-destructive"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      navigate({ to: "/" });
                    },
                  },
                })
              }
            >
              <SignOutIcon className="mr-2" />
              Sign out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
