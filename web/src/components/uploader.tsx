import React, { memo, useState, useSyncExternalStore, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import Dropzone, { type DropzoneState, type FileRejection } from "react-dropzone";
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
import { Textarea } from "./ui/textarea";
import {
  UploadCloud,
  FileVideo,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "./ui/progress";
import { cn, formatByte } from "@/lib/utils";
import { progressStore } from "@/store/progress-store";
import { 
  uploadWithXHR,
  type UploadUrlRequest,
} from "@/lib/api/upload";
import { useGenerateUploadUrl } from "@/hooks/use-upload";
import { useForm, Controller } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { UploadSimpleIcon } from "@phosphor-icons/react";
import { canCreateClip } from "@/lib/utils/credits";
import { processClipsReqSchema } from "@/lib/schema/clips";
import { env } from "@/lib/env";

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters"),
  projectDescription: z.string().optional(),
  file: z.custom<File>((val) => val instanceof File, {
    message: "Please select a video file"
  })
});

type FormData = z.infer<typeof formSchema>;

const ProgressView = memo(function ProgressView({ className }: { className?: string }) {
  const value = useSyncExternalStore(
    progressStore.subscribe, 
    progressStore.get, 
    progressStore.get
  );
  
  return (
    <div className="flex items-center gap-2 w-full">
      <Progress 
        value={value} 
        className={cn(className, value === 100 && "bg-green-400", "w-full flex-1")} 
      />
      <p className="text-sm text-muted-foreground">{value}%</p>
    </div>
  );
});

export const Uploader = memo(function Uploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  
  const router = useRouter();
  const generateUploadUrlMutation = useGenerateUploadUrl();
  const { data: session } = authClient.useSession();
  
  const currentUser = session?.user;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      projectDescription: "",
    },
  });

  const selectedFile = form.watch("file");

  const handleDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        toast.error("File too large", {
          description: "Please select a file under 2GB",
        });
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        toast.error("Invalid file type", {
          description: "Please select an MP4 video file",
        });
      } else {
        toast.error("Error", {
          description: "Failed to select file. Please try again.",
        });
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file) {
        form.setValue("file", file, { shouldValidate: true });
        console.log("File selected:", file.name);
      }
    }
  }, [form]);

  const handleRemoveFile = useCallback(() => {
    form.setValue("file", undefined as any);
    progressStore.set(0);
  }, [form]);

  const handleSubmit = async (data: FormData) => {
    if (!data.file) {
      toast.error("Please select a video file");
      return;
    }

    const userCredits = currentUser?.credits || 0;
    if (!canCreateClip(userCredits)) {
      toast.error("Insufficient Credits", {
        description: "You don't have enough credits to generate clips. Please upgrade your plan.",
      });
      return;
    }

    setIsUploading(true);
    setShowUploadProgress(true);
    setUploadingFile(data.file);

    try {
      const uploadRequest: UploadUrlRequest = { 
        filename: data.file.name, 
        contentType: data.file.type,
        projectName: data.projectName,
        projectDescription: data.projectDescription || undefined
      };

      const uploadResponse = await generateUploadUrlMutation.mutateAsync(uploadRequest);

      try {
        await uploadWithXHR({
          url: uploadResponse.signedUrl,
          file: data.file,
          headers: { "Content-Type": data.file.type || "application/octet-stream" },
          onProgress: ({ loaded, total, percent }) => {
            progressStore.set(percent);
            console.log(`Upload progress: ${percent}% (${loaded}/${total} bytes)`);
          },
        });

        const clipsQueueRequest = processClipsReqSchema.parse({
          s3_key: uploadResponse.key,
          max_clips: 5,
          projectId: uploadResponse.project.id
        });

        const response = await fetch(`${env.VITE_BASE_API}/api/clips/queue`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clipsQueueRequest),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (errorData.code === "INSUFFICIENT_CREDITS") {
            toast.error("Insufficient Credits", {
              description: errorData.error || "You don't have enough credits to generate clips.",
            });
          } else {
            toast.error("Failed to queue clip generation", {
              description: errorData.error || "Please try again.",
            });
          }
          
          router.invalidate();
          throw new Error(`Failed to queue clip generation: ${response.status}`);
        }

        router.navigate({
          to: "/project/$projectId", 
          params: { projectId: uploadResponse.project.id },
        });

      } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("File upload failed. Please try again.");
      }

      form.reset();
      progressStore.set(0);
      setUploadingFile(null);

      toast.success("Video uploaded successfully", {
        description: "Your video has been scheduled for processing.",
        duration: 5000,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Upload failed", {
        description: err.message || "There was a problem uploading your video. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (showUploadProgress && isUploading) {
    return (
      <Card className="flex flex-col w-full max-w-md">
        <CardHeader>
          <CardTitle>Uploading Project</CardTitle>
          <CardDescription>
            Your project is being uploaded and processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-background flex items-center justify-between gap-2 rounded-lg border p-3">
              <div className="flex items-center gap-3 overflow-hidden w-full">
                <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                  <FileVideo className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 w-full flex-col gap-1">
                  <p className="truncate text-sm font-medium">{uploadingFile?.name}</p>
                  <ProgressView className="w-full" />
                  <p className="text-muted-foreground text-xs">
                    {uploadingFile && formatByte(uploadingFile.size)}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we upload and process your video...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="flex flex-col w-full max-w-md dark:bg-background/80 dark:backdrop-blur-md bg-background">
          <CardContent>
              <Form {...form}>
                  <div className="space-y-6">
                      <FormField
                          control={form.control}
                          name="projectName"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="font-normal font-cal text-sm">
                                      Project Name
                                  </FormLabel>
                                  <FormControl>
                                      <Input
                                          placeholder="Enter project name"
                                          {...field}
                                          className="placeholder:text-xs"
                                          disabled={isUploading}
                                      />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />

                      <FormField
                          control={form.control}
                          name="projectDescription"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="font-normal font-cal text-sm">Description</FormLabel>
                                  <FormControl>
                                      <Textarea
                                          placeholder="Add a description for your project"
                                          className="min-h-[100px] resize-none placeholder:text-xs"
                                          {...field}
                                          disabled={isUploading}
                                      />
                                  </FormControl>
                                  <FormDescription className="text-xs">
                                      Provide additional context about your project
                                  </FormDescription>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />

                      <Controller
                          control={form.control}
                          name="file"
                          render={({ field: { onChange, value }, fieldState: { error } }) => (
                              <div className="space-y-2">
                                  <Label className="font-normal font-cal text-sm">Select Media</Label>

                                  <Dropzone
                                      onDrop={handleDrop}
                                      accept={{ "video/mp4": [".mp4"] }}
                                      maxSize={2048 * 1024 * 1024}
                                      disabled={isUploading}
                                      maxFiles={1}
                                      multiple={false}
                                  >
                                      {({
                                          getRootProps,
                                          getInputProps,
                                          isDragActive,
                                      }: DropzoneState) => (
                                          <div
                                              {...getRootProps()}
                                              className={cn(
                                                  "relative w-full transition-colors",
                                                  isDragActive && "opacity-70"
                                              )}
                                          >
                                              <input {...getInputProps()} />

                                              {selectedFile ? (
                                                  <div className="relative">
                                                      <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                                                          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                                                              <FileVideo className="h-5 w-5" />
                                                          </div>
                                                          <div className="flex-1 min-w-0">
                                                              <p className="truncate text-sm font-medium">
                                                                  {selectedFile.name}
                                                              </p>
                                                              <p className="text-xs text-muted-foreground">
                                                                  {formatByte(selectedFile.size)}
                                                              </p>
                                                          </div>
                                                          <button
                                                              type="button"
                                                              onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handleRemoveFile();
                                                              }}
                                                              className="rounded-full p-1 hover:bg-accent transition-colors"
                                                              aria-label="Remove file"
                                                              disabled={isUploading}
                                                          >
                                                              <XIcon className="h-4 w-4" />
                                                          </button>
                                                      </div>
                                                  </div>
                                              ) : (
                                                  <Button
                                                      type="button"
                                                      variant="outline"
                                                      className={cn(
                                                          "w-full py-8 text-center border-dashed font-cal font-medium tracking-tight text-xs",
                                                          isDragActive && "border-primary bg-accent"
                                                      )}
                                                      disabled={isUploading}
                                                  >
                                                      <UploadSimpleIcon className="mr-2 size-4 text-foreground-muted" weight="bold" />
                                                      {isDragActive
                                                          ? "Drop video here"
                                                          : "Select or Drag Video"}
                                                  </Button>
                                              )}
                                          </div>
                                      )}
                                  </Dropzone>

                                  {error && (
                                      <p className="text-xs text-destructive">{error.message}</p>
                                  )}

                                  <p className="text-xs text-muted-foreground">
                                      MP4 videos up to 2GB
                                  </p>
                              </div>
                          )}
                      />

                      <Button
                          type="button"
                          className="w-full text-sm font-cal font-medium tracking-tight"
                          disabled={
                              isUploading ||
                              generateUploadUrlMutation.isPending ||
                              !form.formState.isValid ||
                              !canCreateClip(currentUser?.credits || 0)
                          }
                          onClick={form.handleSubmit(handleSubmit)}
                      >
                          {isUploading
                            ? "Uploading..."
                            : (currentUser?.credits ?? 0) === 0
                              ? "Insufficient Credits"
                              : "Generate Clips"
                          }
                      </Button>
                  </div>
              </Form>
          </CardContent>
      </Card>
  );
});