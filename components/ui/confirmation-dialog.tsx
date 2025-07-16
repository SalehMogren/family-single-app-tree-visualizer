import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Unlink } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "destructive" | "warning" | "default";
  isDarkMode?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel", 
  onConfirm,
  onCancel,
  variant = "destructive",
  isDarkMode = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: <Trash2 className="h-6 w-6 text-red-500" />,
          titleColor: "text-red-600 dark:text-red-400",
          confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
          titleColor: "text-yellow-600 dark:text-yellow-400",
          confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      default:
        return {
          icon: <Unlink className="h-6 w-6 text-blue-500" />,
          titleColor: "text-blue-600 dark:text-blue-400",
          confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[425px] ${isDarkMode ? 'dark' : ''}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${variantStyles.titleColor}`}>
            {variantStyles.icon}
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`w-full sm:w-auto ${variantStyles.confirmButtonClass}`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Specialized confirmation dialogs for common use cases
export const DeleteConfirmationDialog: React.FC<
  Omit<ConfirmationDialogProps, "variant" | "title" | "confirmText">
> = (props) => (
  <ConfirmationDialog
    {...props}
    variant="destructive"
    title="Delete Confirmation"
    confirmText="Delete"
  />
);

export const DisconnectConfirmationDialog: React.FC<
  Omit<ConfirmationDialogProps, "variant" | "title" | "confirmText">
> = (props) => (
  <ConfirmationDialog
    {...props}
    variant="warning"
    title="Disconnect Relationship"
    confirmText="Disconnect"
  />
);

export const RemoveConfirmationDialog: React.FC<
  Omit<ConfirmationDialogProps, "variant" | "title" | "confirmText">
> = (props) => (
  <ConfirmationDialog
    {...props}
    variant="destructive"
    title="Remove Relationship"
    confirmText="Remove"
  />
);