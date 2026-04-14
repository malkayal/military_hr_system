import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'خطأ غير معروف' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-10 text-center space-y-8 animate-in fade-in duration-500">
          <div className="p-8 bg-red-50 dark:bg-red-950/20 rounded-[3rem] border-2 border-red-100 dark:border-red-900/30">
            <AlertOctagon size={64} className="text-red-500 mx-auto animate-pulse" />
          </div>
          <div className="space-y-3 max-w-md">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
              واجهت هذه الصفحة مشكلة تقنية. يمكنك المحاولة مجدداً أو التواصل مع الدعم الفني.
            </p>
            {this.state.errorMessage && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 text-xs font-mono text-slate-500 dark:text-slate-400 text-right break-all">
                {this.state.errorMessage}
              </div>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw size={20} />
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
