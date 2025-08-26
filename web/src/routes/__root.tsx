import Header from "@/components/header";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
    HeadContent,
    Outlet,
    createRootRouteWithContext,
    useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";
import { cn } from "@/lib/utils";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
    component: RootComponent,
    head: () => ({
        meta: [
            {
                title: "app",
            },
            {
                name: "description",
                content: "app is a web application",
            },
        ],
        links: [
            {
                rel: "icon",
                href: "/favicon.ico",
            },
        ],
    }),
});

function RootComponent() {
    const isFetching = useRouterState({
        select: (s) => s.isLoading,
    });

    const path = window.location.pathname;
    const isHomePage = path === "/";

    return (
        <>
            <HeadContent />
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                disableTransitionOnChange
                storageKey="vite-ui-theme"
            >
                <div
                    className={cn(
                        "grid grid-rows-[auto_1fr] h-svh w-full bg-cover bg-no-repeat bg-center",
                        isHomePage
                            ? "bg-[url('https://ik.imagekit.io/omraval/Gemini_Generated_Image_5fd7st5fd7st5fd7_kba5cc8Cv.png?updatedAt=1755704545986')]"
                            : ""
                    )}
                >
                    <Header />
                    {isFetching ? <Loader /> : <Outlet />}
                </div>
                <Toaster richColors />
            </ThemeProvider>
            <TanStackRouterDevtools position="bottom-left" />
        </>
    );
}
