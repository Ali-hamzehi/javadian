import React from 'react';
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  // The supplied project has no @types/react; declare the inherited React contract.
  declare props: { children: React.ReactNode };
  declare setState: (state: { failed: boolean }) => void;
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Application render failed', error); }
  render() {
    if (this.state.failed) return <main dir="rtl" className="min-h-screen flex items-center justify-center p-6 bg-slate-50"><section role="alert" className="max-w-md bg-white border rounded-2xl p-8 space-y-4"><h1 className="font-bold text-lg">نمایش این صفحه با مشکل مواجه شد</h1><p className="text-sm text-slate-600">دوباره تلاش کنید. اگر مشکل ادامه داشت، شرح آخرین اقدام را به پشتیبانی بدهید.</p><button type="button" onClick={() => this.setState({ failed: false })} className="bg-teal-800 text-white px-4 py-2 rounded-lg">تلاش دوباره</button></section></main>;
    return this.props.children;
  }
}
