import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4">😕 אופס!</h1>
            <p className="text-gray-400 mb-6">
              משהו השתבש. אבל אל תדאג - הנתונים שלך בטוחים.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              רענן את הדף
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left text-sm">
                <summary className="cursor-pointer text-gray-500">
                  פרטים טכניים (למפתחים)
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 rounded overflow-auto text-red-400">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
