'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface LikeAnimationProps {
  show: boolean;
}

export function LikeAnimation({ show }: LikeAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 15,
            duration: 0.4,
          }}
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Heart className="h-20 w-20 text-red-500 fill-red-500 drop-shadow-lg" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
