import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Card Arena:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full glass-panel border border-rose-500/60 p-8 rounded-3xl shadow-2xl shadow-rose-950/40">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400 flex items-center justify-center mx-auto mb-4 text-3xl">
              ⚔️
            </div>
            <h2 className="text-xl font-black font-display uppercase tracking-wider text-white mb-2">
              Arena System Recovered
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-semibold">
              The arena caught a temporary runtime exception and protected your profile state.
            </p>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-arena-blue to-arena-cyan text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition cursor-pointer"
            >
              Return to Arena Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
