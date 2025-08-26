export function getFileNameFromRelative(relativePath: string): string {
    return (
        relativePath
            .replace(/^\.\/+/, "")
            .split("/")
            .pop() ?? ""
    );
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export const isValidationError = (error: unknown): boolean => {
  return error instanceof Error && error.name === "ZodError";
};

export * from "./credits";
