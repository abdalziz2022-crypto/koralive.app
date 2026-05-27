import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  error?: Error | string;
}

export default function ErrorState({
  title = 'حدث خطأ غير متوقع',
  description = 'تعذر تحميل البيانات المطلوبة في الوقت الحالي. يرجى التحقق من اتصالك بالإنترنت والتحميل مجدداً.',
  onRetry,
  retryLabel = 'إعادة المحاولة',
  error,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-rose-500/5 border border-dashed border-rose-500/10 rounded-3xl space-y-4 max-w-md mx-auto select-none my-6">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm md:text-base font-black text-rose-400">
          {title}
        </h3>
        <p className="text-[11px] md:text-xs text-gray-400 font-bold leading-relaxed px-2">
          {description}
        </p>
        
        {error && (
          <pre className="text-[10px] font-mono p-2.5 bg-black/40 text-rose-300 rounded-lg overflow-x-auto max-w-xs text-left whitespace-pre-wrap mt-2 select-text">
            {typeof error === 'string' ? error : error.message}
          </pre>
        )}
      </div>

      {onRetry && (
        <Button
          variant="danger"
          size="sm"
          onClick={onRetry}
          className="px-6"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
