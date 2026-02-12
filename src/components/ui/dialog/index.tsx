import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DialogContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
} | null>(null);

const useDialog = () => {
    const context = React.useContext(DialogContext);
    if (!context) {
        throw new Error("Dialog components must be wrapped in <Dialog />");
    }
    return context;
};

export const Dialog: React.FC<{
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}> = ({ children, open, onOpenChange }) => {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    );
};

export const DialogContent: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => {
    const { open, onOpenChange } = useDialog();

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                onClick={() => onOpenChange(false)}
            />
            <div
                className={cn(
                    "relative z-50 w-full max-w-lg overflow-hidden bg-white dark:bg-[#121212] shadow-2xl border border-gray-100 dark:border-white/10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4",
                    className
                )}
            >
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors z-10"
                >
                    <X className="h-4 w-4" />
                </button>
                {children}
            </div>
        </div>,
        document.body
    );
};

export const DialogHeader: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
        {children}
    </div>
);

export const DialogFooter: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
        {children}
    </div>
);

export const DialogTitle: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
        {children}
    </h2>
);

export const DialogDescription: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => (
    <p className={cn("text-sm text-gray-500 dark:text-gray-400", className)}>
        {children}
    </p>
);
