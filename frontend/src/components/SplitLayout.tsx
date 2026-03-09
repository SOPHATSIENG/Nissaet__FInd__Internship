import React from 'react';

interface SplitLayoutProps {
  children: React.ReactNode;
  imageSrc: string;
  imageOverlayClass?: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  stepIndicator?: { current: number; total: number };
  layoutType?: 'login' | 'register';
}

export function SplitLayout({
  children,
  imageSrc,
  imageOverlayClass = 'bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent',
  title,
  subtitle,
  badge,
  stepIndicator,
  layoutType = 'register',
}: SplitLayoutProps) {
  const leftWidthClass = layoutType === 'login' ? 'lg:w-1/2 xl:w-7/12' : 'lg:w-1/2';
  const rightWidthClass = layoutType === 'login' ? 'lg:w-1/2 xl:w-5/12' : 'lg:w-1/2';

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row overflow-hidden bg-[#f6f7f8] text-slate-900">
      {/* Left Side */}
      <div className={`relative hidden w-full lg:flex ${leftWidthClass} bg-cover bg-center`} style={{ backgroundImage: `url(${imageSrc})` }}>
        <div className={`absolute inset-0 ${imageOverlayClass}`}></div>
        <div className="absolute bottom-0 left-0 p-12 text-white z-10 w-full">
          {badge && <div className="mb-4">{badge}</div>}
          <h1 className="mb-4 text-4xl font-black tracking-tight lg:text-5xl">{title}</h1>
          <p className="max-w-lg text-lg text-white/90 font-medium">{subtitle}</p>
          
          {stepIndicator && (
            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center gap-2">
                {Array.from({ length: stepIndicator.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full ${i + 1 === stepIndicator.current ? 'w-8 bg-white' : 'w-8 bg-white/40'}`}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side */}
      <div className={`flex w-full flex-col justify-center bg-[#f6f7f8] px-6 py-12 ${rightWidthClass} lg:px-12 overflow-y-auto`}>
        <div className="mx-auto w-full max-w-[480px]">
          {children}
        </div>
      </div>
    </div>
  );
}
