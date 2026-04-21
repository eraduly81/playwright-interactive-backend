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
              <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center border border-white">
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
