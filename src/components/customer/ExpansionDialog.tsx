import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ExpansionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>We're Not in Your Area Yet</DialogTitle>
          <DialogDescription>
            Handled Home is expanding. We'll notify you as soon as we launch in your neighborhood.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => {
              toast.success("We'll let you know!");
              onOpenChange(false);
              navigate("/customer");
            }}
            className="w-full"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notify Me
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              navigate("/customer");
            }}
            className="w-full"
          >
            Continue Exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
