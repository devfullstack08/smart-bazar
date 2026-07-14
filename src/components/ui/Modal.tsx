'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}: ModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop with transparency - more transparent */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />

            {/* Modal Content */}
            <div
                className={`relative bg-white dark:bg-[#12121a] rounded-2xl shadow-xl border border-gray-200/80 dark:border-white/10 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto z-10`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-[#12121a] rounded-t-2xl z-10">
                        {title && (
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"
                                aria-label="Close modal"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-6 text-gray-900 dark:text-white">{children}</div>
            </div>
        </div>
    );
}
