import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-dark-950 px-4">
          <p className="text-5xl">⚠️</p>
          <h2 className="text-xl font-bold text-white">页面渲染出错</h2>
          <p className="text-gray-400 text-sm max-w-md text-center">{this.state.error?.message}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 rounded-xl bg-muse-500 text-white text-sm hover:bg-muse-400 transition-colors">
              重试
            </button>
            <Link to="/" onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm hover:bg-white/20 transition-colors">
              返回首页
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
