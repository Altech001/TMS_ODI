import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const DropdownMenuContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRect: DOMRect | null;
    setTriggerRect: (rect: DOMRect | null) => void;
} | null>(null);

const useDropdownMenu = () => {
    const context = React.useContext(DropdownMenuContext);
    if (!context) {
        throw new Error("DropdownMenu components must be wrapped in <DropdownMenu />");
    }
    return context;
};

export const DropdownMenu: React.FC<{
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}> = ({ children }) => {
    const [open, setOpen] = React.useState(false);
    const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null);

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen, triggerRect, setTriggerRect }}>
            <div className="relative inline-block">{children}</div>
        </DropdownMenuContext.Provider>
    );
};

export const DropdownMenuTrigger: React.FC<{
    children: React.ReactElement;
    asChild?: boolean;
}> = ({ children }) => {
    const { setOpen, open, setTriggerRect } = useDropdownMenu();
    const triggerRef = React.useRef<HTMLElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (triggerRef.current) {
            setTriggerRect(triggerRef.current.getBoundingClientRect());
        }
        setOpen(!open);
    };

    return React.cloneElement(children as React.ReactElement<any>, {
        ref: triggerRef,
        onClick: (e: React.MouseEvent) => {
            const childrenProps = children.props as any;
            if (childrenProps.onClick) childrenProps.onClick(e);
            handleClick(e);
        },
    });
};

export const DropdownMenuContent: React.FC<{
    children: React.ReactNode;
    className?: string;
    align?: "start" | "end" | "center";
}> = ({ children, className, align = "start" }) => {
    const { open, setOpen, triggerRect } = useDropdownMenu();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener("mousedown", handleOutsideClick);
        }
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [open, setOpen]);

    if (!open || !triggerRect) return null;

    const style: React.CSSProperties = {
        position: "fixed",
        top: triggerRect.bottom + 8,
        zIndex: 999999, // Increased to appear above modals
    };

    if (align === "start") {
        style.left = triggerRect.left;
    } else if (align === "end") {
        style.right = window.innerWidth - triggerRect.right;
    } else {
        style.left = triggerRect.left + triggerRect.width / 2;
        style.transform = "translateX(-50%)";
    }

    return createPortal(
        <div
            ref={contentRef}
            style={style}
            className={cn(
                "min-w-[8rem] overflow-hidden rounded-md border border-gray-100 bg-white p-1 text-gray-950 shadow-md animate-in fade-in zoom-in-95 dark:border-white/10 dark:bg-[#121212] dark:text-gray-50",
                className
            )}
        >
            {children}
        </div>,
        document.body
    );
};

export const DropdownMenuItem: React.FC<{
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}> = ({ children, className, onClick }) => {
    const { setOpen } = useDropdownMenu();

    return (
        <div
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-gray-50",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(e);
                setOpen(false);
            }}
        >
            {children}
        </div>
    );
};

export const DropdownMenuLabel: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => (
    <div className={cn("px-2 py-1.5 text-xs font-semibold opacity-60 uppercase tracking-widest", className)}>
        {children}
    </div>
);

export const DropdownMenuSeparator: React.FC<{
    className?: string;
}> = ({ className }) => (
    <div className={cn("-mx-1 my-1 h-px bg-gray-100 dark:bg-white/10", className)} />
);

