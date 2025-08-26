import { ProjectsList } from "@/components/projects-list";
import { createFileRoute, Router, useRouter } from "@tanstack/react-router";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@phosphor-icons/react";

export const Route = createFileRoute("/projects")({
    component: Projects,
});

function Projects() {
    const router = useRouter()
    const handleRedirect = () => {
        router.navigate({ to: "/" });
    }
    return (
        <div className="bg-background w-full h-full">
            <div className="flex p-8 items-center justify-between mb-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#" className="flex items-center gap-2">
                                <HomeIcon size={16} aria-hidden="true" />
                                <span className="">Home</span>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator> / </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Projects</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <Button className="flex items-center gap-2" onClick={handleRedirect}>
                    <PlusIcon className="size-4" />
                    New Project
                </Button>
            </div>
            <ProjectsList />
        </div>
    );
}
