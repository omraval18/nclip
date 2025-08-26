import { cva } from "class-variance-authority"
import { type HTMLMotionProps, motion } from "motion/react"

import { cn } from "@/lib/utils"

const waveLoaderVariants = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
})

export interface WaveLoaderProps {
  /**
   * The number of bouncing dots to display.
   * @default 5
   */
  bars?: number
  /**
   * Optional message to display alongside the bouncing dots.
   */
  message?: string
  /**
   * Position of the message relative to the spinner.
   * @default bottom
   */
  messagePlacement?: "bottom" | "left" | "right"
}

export function WaveLoader({
  bars = 5,
  message,
  messagePlacement,
  className,
  ...props
}: HTMLMotionProps<"div"> & WaveLoaderProps) {
  return (
    <div className={cn(waveLoaderVariants({ messagePlacement }))}>
      <div className={cn("flex gap-1 items-center justify-center")}>
        {Array(bars)
          .fill(undefined)
          .map((_, index) => (
            <motion.div
              key={index}
              className={cn("w-2 h-5 bg-foreground origin-bottom", className)}
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.1,
              }}
              {...props}
            />
          ))}
      </div>
      {message && <div>{message}</div>}
    </div>
  )
}

type Status = "queued" | "processing" | "completed" | "failed";
export function StatusLoader({status}: {status: Status}) {
  return <div className="flex flex-col gap-4 items-center justify-center">
    <div className="border-primary h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 ease-linear"></div>

    <p className="font-bold text-sm tracking-wide font-ark capitalize text-[#fffee1]">{status}</p>
  </div>

}