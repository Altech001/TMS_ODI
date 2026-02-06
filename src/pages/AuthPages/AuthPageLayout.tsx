import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#25293C] flex items-center justify-center lg:p-6 font-primary text-gray-700 dark:text-gray-300">
      <div className="w-full max-w-[1500px] min-h-[100vh] lg:min-h-[85vh] flex overflow-hidden relative">

        {/* Left Side: Illustration & Branding */}
        <div className="hidden lg:flex w-[65%] bg-gray-100 dark:bg-[#25293C] relative items-center justify-center overflow-hidden">
          {/* Logo at Top Left */}
          <div className="absolute top-10 left-10 flex items-center gap-3 z-20">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L4 7L12 11L20 7L12 3Z" fill="white" />
                <path d="M4 11L12 15L20 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 15L12 19L20 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">ODI XTECH</span>
          </div>

          {/* Main Illustration */}
          <div className="relative z-10 w-full max-w-2xl transform hover:scale-[1.02] transition-transform duration-700 ease-out">
            <img
              src="/images2.svg"
              alt="Workspace Illustration"
              className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            />
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-500 opacity-5 rounded-full blur-[100px]"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-500 opacity-5 rounded-full blur-[100px]"></div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="w-full lg:w-[35%] flex flex-col justify-center px-8 md:px-16 py-12 relative bg-white dark:bg-[#2F3349]">
          {/* Mobile Logo Visibility */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L4 7L12 11L20 7L12 3Z" fill="white" />
                <path d="M4 11L12 15L20 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 15L12 19L20 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white">ODI XTECH</span>
          </div>

          <div className="w-full max-w-sm mx-auto">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
