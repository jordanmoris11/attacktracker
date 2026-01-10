import React from 'react';
import { Header } from './Header';

interface MainLayoutProps {
    children: React.ReactNode;
}

/**
 * Spec 6: App Shell
 * Fixed Viewport Layout. 
 * - H-Screen, W-Screen, Overflow-Hidden.
 * - Header fixed top.
 * - Main content fills remainder using flex-1.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="h-screen w-screen bg-background-primary flex flex-col overflow-hidden text-slate-200 font-sans selection:bg-brand-blue/30 selection:text-white">
            <Header />

            <main className="flex-1 relative flex overflow-hidden">
                {/* Children (Graph) will be absolute inset-0 usually, or flex full */}
                {children}
            </main>
        </div>
    );
};
