import React from "react";
import { XIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "bg-white shadow-lg rounded-lg max-w-xs w-full overflow-hidden mb-3",
  {
    variants: {
      variant: {
        default: "border-l-4 border-primary-600",
        success: "border-l-4 border-green-500",
        warning: "border-l-4 border-amber-500",
        destructive: "border-l-4 border-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ToastProps extends VariantProps<typeof toastVariants> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const ToastNotification: React.FC<ToastProps> = ({
  variant,
  title,
  description,
  icon,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  if (!visible) return null;

  const getIconColor = () => {
    switch (variant) {
      case "success":
        return "text-green-500";
      case "warning":
        return "text-amber-500";
      case "destructive":
        return "text-red-500";
      default:
        return "text-primary-600";
    }
  };

  return (
    <div className={cn(toastVariants({ variant }))}>
      <div className="flex items-center p-4">
        {icon && <div className={cn("flex-shrink-0", getIconColor())}>{icon}</div>}
        <div className={cn("flex-1", icon ? "ml-3" : "")}>
          <p className="text-sm font-medium text-gray-800">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <button
          className="ml-3 text-gray-400 hover:text-gray-500"
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <div
        className={cn("h-1 animate-[progress_5s_linear]", {
          "bg-primary-600": variant === "default" || !variant,
          "bg-green-500": variant === "success",
          "bg-amber-500": variant === "warning",
          "bg-red-500": variant === "destructive",
        })}
      ></div>
    </div>
  );
};
