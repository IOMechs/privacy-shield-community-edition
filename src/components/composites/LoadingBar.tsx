"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  Sparkles,
  CropIcon,
  CrossIcon,
  CircleX,
} from "lucide-react";
import {
  AlertDialogDescription,
  AlertDialogTitle,
} from "@radix-ui/react-alert-dialog";

interface LoadingBarProps {
  isOpen: boolean;
  stage: "idle" | "pending" | "error" | "success";
  onClose?: () => void;
  isError: boolean;
}

const title = "Redacting your document";
const description = "Please wait while we process your document";

export default function LoadingBar({
  isOpen,
  stage,
  onClose,
  isError,
}: LoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Use refs to store values that should be consistent per instance
  const configRef = useRef({
    randomStoppingPoint: 0,
    duration: 0,
    startTime: 0,
    lastProgress: 0,
  });

  // Initialize config when modal opens
  useEffect(() => {
    if (isOpen && stage === "pending") {
      configRef.current = {
        randomStoppingPoint: 65 + Math.random() * 25,
        duration: 90000 + Math.random() * 10000,
        startTime: Date.now(),
        lastProgress: 0,
      };
      setProgress(0);
      setIsCompleting(false);
    }
    console.log("Modal opening", stage);
  }, [isOpen, stage]);

  // Random progress animation
  useEffect(() => {
    console.log("Modal changing prog", stage);
    if (!isOpen || stage !== "pending" || isCompleting) return;

    const animateProgress = () => {
      const { randomStoppingPoint, duration, startTime } = configRef.current;
      const elapsed = Date.now() - startTime;
      // Calculate base progress (linear progression to stopping point)
      const baseProgress = Math.min(
        (elapsed / duration) * randomStoppingPoint,
        randomStoppingPoint
      );

      // Add controlled randomness that only increases progress
      const randomBoost = Math.sin(elapsed / 2000) * 1.5 + Math.random() * 2;
      const newProgress = Math.min(
        Math.max(baseProgress + randomBoost, configRef.current.lastProgress),
        randomStoppingPoint
      );

      // Ensure progress never decreases
      if (newProgress >= configRef.current.lastProgress) {
        configRef.current.lastProgress = newProgress;
        setProgress(newProgress);
      }

      if (elapsed < duration && stage === "pending" && !isCompleting) {
        requestAnimationFrame(animateProgress);
      }
    };

    const animationId = requestAnimationFrame(animateProgress);
    return () => cancelAnimationFrame(animationId);
  }, [isOpen, stage, isCompleting]);

  // Handle completion when stage changes from pending
  useEffect(() => {
    if (isOpen && stage !== "pending" && !isCompleting) {
      setIsCompleting(true);
      const startProgress = configRef.current.lastProgress;
      const startTime = Date.now();
      const duration = 1000;

      const completeAnimation = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        const currentProgress =
          startProgress + (100 - startProgress) * progressRatio;

        setProgress(currentProgress);
        configRef.current.lastProgress = currentProgress;

        if (progressRatio < 1) {
          requestAnimationFrame(completeAnimation);
        } else {
          setTimeout(() => {
            onClose?.();
          }, 1500);
        }
      };

      requestAnimationFrame(completeAnimation);
    }
  }, [stage, isOpen, isCompleting, onClose]);

  //Handle Error while processing
  useEffect(() => {
    setTimeout(() => {
      onClose?.();
    }, 2000);
  }, [isError]);

  const getStageContent = () => {
    if (stage !== "pending") {
      return {
        icon: <CheckCircle className="w-8 h-8 text-primary" />,
        title: "Complete!",
        description: "Your document has been redacted successfully.",
      };
    } else if (isError) {
      return {
        icon: <CrossIcon className="w-8 h-8 text-primary" />,
        title: "Complete!",
        description: "Your document has been redacted successfully.",
      };
    } else {
      return {
        icon: <Loader2 className="w-8 h-8 text-primary animate-spin" />,
        title,
        description,
      };
    }
  };

  const stageContent = getStageContent();

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="border-none bg-transparent p-0 shadow-none">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md mx-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl animate-pulse" />
              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl">
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-primary/30 rounded-full"
                      animate={{
                        x: [0, Math.random() * 300, 0],
                        y: [0, Math.random() * 200, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: Math.random() * 2,
                      }}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                    />
                  ))}
                </div>

                {isError ? (
                  <div className="relative z-10 text-center space-y-6">
                    <motion.div
                      animate={
                        stage !== "pending" ? { scale: [1, 1.2, 1] } : {}
                      }
                      transition={{ duration: 0.5 }}
                      className="flex justify-center"
                    >
                      <CircleX className="w-8 h-8 text-red-500" />
                    </motion.div>
                    <AlertDialogTitle asChild>
                      <motion.h2
                        key={stageContent.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-semibold text-foreground"
                      >
                        An Error Occured
                      </motion.h2>
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <motion.p
                        key={stageContent.description}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                      >
                        Something went wrong while redacting your document
                      </motion.p>
                    </AlertDialogDescription>
                  </div>
                ) : (
                  <div className="relative z-10 text-center space-y-6">
                    <motion.div
                      animate={
                        stage !== "pending" ? { scale: [1, 1.2, 1] } : {}
                      }
                      transition={{ duration: 0.5 }}
                      className="flex justify-center"
                    >
                      {stageContent.icon}
                    </motion.div>
                    <AlertDialogTitle asChild>
                      <motion.h2
                        key={stageContent.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-semibold text-foreground"
                      >
                        {stageContent.title}
                      </motion.h2>
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <motion.p
                        key={stageContent.description}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                      >
                        {stageContent.description}
                      </motion.p>
                    </AlertDialogDescription>
                    {/* Progress bar container */}
                    <div className="space-y-3">
                      <div className="relative">
                        {/* Animated background pattern */}
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse" />

                          {/* Progress fill */}
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full relative overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{
                              duration: isCompleting ? 0.1 : 0.5,
                              ease: "easeOut",
                            }}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          </motion.div>
                        </div>

                        {/* Progress glow */}
                        <motion.div
                          className="absolute inset-0 h-3 bg-gradient-to-r from-primary/50 to-primary/50 rounded-full blur-sm"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                          }}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <motion.div
                        className="flex justify-between items-center text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="text-muted-foreground">
                          {Math.round(progress)}%
                        </span>
                        {stage === "pending" && !isCompleting && (
                          <div className="flex items-center gap-1 text-primary">
                            <Sparkles className="w-3 h-3" />
                            <span className="text-xs">Processing</span>
                          </div>
                        )}
                        {isCompleting && (
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle className="w-3 h-3" />
                            <span className="text-xs">Finalizing</span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </AlertDialogContent>
    </AlertDialog>
  );
}
