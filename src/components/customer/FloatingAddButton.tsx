import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface FloatingAddButtonProps {
  onClick: () => void;
}

export function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
      aria-label="Add a service"
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  );
}
