import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, XCircle, X } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ErrorContextType {
  showToast: (message: string, type?: ToastType) => void;
  showError: (error: any) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const showError = useCallback((error: any) => {
    // Log all errors securely in console only
    console.error("[System Core Error Interceptor]:", error);

    let message = 'حدث خطأ في الاتصال بالخدمة. البيانات معروضة بالاعتماد على التراجع المحلي المستقر.';
    
    const errStr = typeof error === 'string' ? error : (error?.message || '');
    if (
      errStr.includes('NO_API_KEY') || 
      errStr.includes('لم يتم إعداد') || 
      errStr.includes('Unauthorized') || 
      errStr.includes('401') || 
      errStr.includes('API key') ||
      errStr.includes('footballApiStatus')
    ) {
      message = 'لم يتم إعداد مصدر البيانات بعد. يرجى إضافة مفاتيح البيئة من إعدادات Vercel.';
    } else if (typeof error === 'string') {
      // Suppress highly technical strings or direct DB paths
      if (!error.includes('Object') && !error.includes('Error') && !error.includes('/') && !error.includes('firestore')) {
        message = error;
      }
    } else if (error?.message) {
      if (error.message.includes('permission-denied') || error.message.includes('insufficient permissions')) {
        message = 'عذراً، لا نملك صلاحية الوصول لهذه البيانات الحساسة حالياً.';
      } else if (error.message.includes('network-request-failed') || error.message.includes('Failed to fetch')) {
        message = 'خطأ في الاتصال بالشبكة. يرجى التحقق من جودة موجز الإنترنت الخاص بك.';
      } else if (error.message.includes('RESOURCE_EXHAUSTED')) {
        message = 'تم تجاوز حصة العمل السحابية لقاعدة البيانات الكبرى. متاح العمل بنظام التراجع الفائق الكافي.';
      }
    }
    
    showToast(message, 'error');
  }, [showToast]);

  return (
    <ErrorContext.Provider value={{ showToast, showError }}>
      {children}
      <div className="fixed top-24 left-4 right-4 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl glass border border-white/10 shadow-2xl min-w-[300px] max-w-md"
            >
              {toast.type === 'error' && <XCircle className="text-red-500 shrink-0" size={20} />}
              {toast.type === 'success' && <CheckCircle2 className="text-green-500 shrink-0" size={20} />}
              {toast.type === 'warning' && <AlertCircle className="text-yellow-500 shrink-0" size={20} />}
              {toast.type === 'info' && <AlertCircle className="text-blue-500 shrink-0" size={20} />}
              
              <p className="flex-1 text-sm font-bold text-white/90 leading-tight">
                {toast.message}
              </p>
              
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="hover:bg-white/5 p-1 rounded-lg transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
