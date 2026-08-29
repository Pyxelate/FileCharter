import { Button } from "@/shadcn-components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/shadcn-components/ui/popover"
import {EllipsisVertical} from "lucide-react";

export function PopoverBasic({children}) {
    return (
        <>
            <Popover>
                <PopoverTrigger render={<Button variant="outline" className="w-fit"><EllipsisVertical /></Button>} />
                <PopoverContent align="start">
                    <PopoverHeader>
                        {children}

                    </PopoverHeader>
                </PopoverContent>
            </Popover>
        </>
    )
}
