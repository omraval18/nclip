"use client"

import { useState } from "react"

import { Toggle } from "@/components/ui/toggle"
import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

export  function ModeToggle() {
  const { theme,setTheme } = useTheme();

  return (
    <div>
      <Toggle
        variant="outline"
        className="group data-[state=on]:hover:bg-muted text-muted-foreground data-[state=on]:text-muted-foreground data-[state=on]:hover:text-foreground size-8 rounded-full border-none shadow-none data-[state=on]:bg-transparent"
        size={"sm"}
        pressed={theme === "dark"}
        onPressedChange={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <MoonIcon
          className="shrink-0 size-4 scale-0 opacity-0 transition-all group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
          aria-hidden="true"
          weight="bold"
        />
        <SunIcon
          className="absolute shrink-0 size-4 scale-100 opacity-100 transition-all group-data-[state=on]:scale-0 group-data-[state=on]:opacity-0"
          aria-hidden="true"
          weight="bold"
        />
      </Toggle>
    </div>
  )
}