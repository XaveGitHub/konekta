import React from "react";
import { Text } from "./text";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  className?: string;
}

export const SectionHeader = ({ label, className }: SectionHeaderProps) => {
  return (
    <Text
      variant="sectionLabel"
      className={cn("mb-2.5 px-8", className)}
    >
      {label}
    </Text>
  );
};
