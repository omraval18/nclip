import { useId } from "react"
import {
  HomeIcon,
  LayersIcon,
} from "lucide-react"
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import UserMenu from "./user-menu";
import { ModeToggle } from "./mode-toggle";
import Logo from "./logo";

const navigationLinks = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/projects", label: "Projects", icon: LayersIcon },
]

export default function Header() {
  const id = useId()
  const path = window.location.pathname
  const isHomePage = path === "/"

  return (
    <header className={cn(
      " max-w-xl mx-auto w-full mt-2 px-4 md:px-6",
      isHomePage ? "bg-background/40 backdrop-blur-md border border-transparent" : "bg-background border"
    )}>
      <div className="flex h-12 items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
              >
                <svg
                  className="pointer-events-none"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-36 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link, index) => {
                    const Icon = link.icon
                    const isActive = path === link.to
                    return (
                      <NavigationMenuItem key={index} className="w-full">
                        <Link to={link.to} className="w-full">
                          <NavigationMenuLink
                            className="flex-row items-center gap-2 py-1.5 w-full"
                            active={isActive}
                          >
                            <Icon
                              size={16}
                              className="text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span>{link.label}</span>
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>
                    )
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-primary hover:text-primary/90">
              <Logo />
            </Link>
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-2">
                <TooltipProvider>
                  {navigationLinks.map((link) => {
                    const isActive = path === link.to
                    return (
                        <NavigationMenuItem key={link.label}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link to={link.to}>
                                        <NavigationMenuLink
                                            className={cn(
                                                "flex size-8 items-center justify-center p-1.5",
                                                isActive && "bg-accent text-foreground"
                                            )}
                                        >
                                            <link.icon
                                                className={cn("size-3.5", isActive && "text-foreground")}
                                                aria-hidden="true"
                                            />
                                            <span className="sr-only">{link.label}</span>
                                        </NavigationMenuLink>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="px-2 py-1 text-xs">
                                    <p>{link.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </NavigationMenuItem>
                    );
                  })}
                </TooltipProvider>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}