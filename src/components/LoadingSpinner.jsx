import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Cargando...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} text-emooti-blue-500`}
      >
        <Brain className="w-full h-full" />
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-slate-600 font-medium"
      >
        {text}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;
