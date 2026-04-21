import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="bg-black shadow-lg border-b-4 border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center border-2 border-white">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Playwright Spec Kit</h1>
            </div>
            <nav className="flex space-x-4">
              <a href="/" className="text-gray-300 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Help
              </a>
              <a href="/help" className="text-gray-300 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Documentation
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
