import { Button } from "@/shadcn-components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@/shadcn-components/ui/popover";
import { EllipsisVertical } from "lucide-react";
import type { ReactNode } from "react";

export function PopoverBasic({ children }: { children: ReactNode }) {
  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" className="w-fit">
              <EllipsisVertical />
            </Button>
          }
        />
        <PopoverContent align="start">
          <PopoverHeader>{children}</PopoverHeader>
        </PopoverContent>
      </Popover>
    </>
  );
}
