import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {icon && (
        <motion.div
          className="text-6xl mb-6 opacity-40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
        >
          {icon}
        </motion.div>
      )}
      
      <h3 className="text-xl font-bold text-gray-300 mb-2 font-sans">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-400 mb-6 max-w-md font-serif">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="bg-gradient-accent hover:bg-gradient-accent-hover text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 font-sans"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
