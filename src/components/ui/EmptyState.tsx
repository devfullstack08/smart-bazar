import { ReactNode } from 'react';

interface EmptyStateProps {
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    icon?: ReactNode;
}

export function EmptyState({ message, action, icon }: EmptyStateProps) {
    return (
        <div className="text-center py-16 px-4">
            {icon && (
                <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-500">
                    {icon}
                </div>
            )}
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">{message}</p>
            {action && (
                <button onClick={action.onClick} className="btn btn-primary px-6 py-3 rounded-xl font-medium">
                    {action.label}
                </button>
            )}
        </div>
    );
}
