export enum UserPlan {
    FREE = "free",
    PRO = "pro",
    MAX = "max",
}

export const PLAN_LIMITS = {
    [UserPlan.FREE]: {
        credits: 0,
        maxProjects: 0,
    },
    [UserPlan.PRO]: {
        credits: 20,
        maxProjects: 10,
    },
    [UserPlan.MAX]: {
        credits: 100,
        maxProjects: -1, // for unlimited projects
    },
} as const;

export const PRODUCT_PLAN_MAPPING: Record<string, UserPlan> = {
    "pdt_KJ8qkzP8nxQhQMXxUXR3I": UserPlan.PRO,
    // "": UserPlan.MAX,
} as const;

export const CREDIT_COSTS = {
    CLIP_CREATION: 1,
} as const;

export function canCreateProject(currentProjects: number, plan: UserPlan): boolean {
    const limit = PLAN_LIMITS[plan].maxProjects;
    if (limit === -1) return true; // for unlimited projects
    return currentProjects < limit;
}

export function canCreateClip(credits: number): boolean {
    return credits >= CREDIT_COSTS.CLIP_CREATION;
}

export function getMaxCreditsForPlan(plan: UserPlan): number {
    return PLAN_LIMITS[plan].credits;
}

export function getMaxProjectsForPlan(plan: UserPlan): number {
    return PLAN_LIMITS[plan].maxProjects;
}

export function getPlanDisplayName(plan: UserPlan): string {
    switch (plan) {
        case UserPlan.FREE:
            return "Free";
        case UserPlan.PRO:
            return "Pro";
        case UserPlan.MAX:
            return "Max";
        default:
            return "Free";
    }
}

export function getCreditStatusMessage(credits: number, plan: UserPlan): string {
    if (credits === 0) {
        return "You've run out of credits. Upgrade your plan to continue creating clips.";
    }
    if (credits <= 2) {
        return `You're running low on credits (${credits} remaining). Consider upgrading your plan.`;
    }
    return `${credits} credits remaining`;
}

export function getProjectLimitMessage(currentProjects: number, plan: UserPlan): string {
    const maxProjects = getMaxProjectsForPlan(plan);
    if (maxProjects === -1) {
        return "Unlimited projects";
    }
    if (currentProjects >= maxProjects) {
        return "You've reached your project limit. Upgrade your plan to create more projects.";
    }
    return `${currentProjects}/${maxProjects} projects used`;
}

export function toUserPlan(str: string): UserPlan {
    if (!Object.values(UserPlan).includes(str as UserPlan)) return UserPlan.FREE;
    return str as UserPlan;
}

export function getPlanFromProductId(productId: string): UserPlan {
    return PRODUCT_PLAN_MAPPING[productId] || UserPlan.FREE;
}