import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

export const InlineLoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Loader2 className={cn("inline-block h-4 w-4 animate-spin text-gray-500", className)} />
);
