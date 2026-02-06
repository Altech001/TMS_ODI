import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="404 - Page Not Found | ODI XTECH"
        description="The page you are looking for has been moved or does not exist."
      />
      <div className="min-h-screen bg-[#25293C] flex items-center justify-center p-6 relative overflow-hidden font-primary text-gray-300">

        {/* Decorative Background Elements (Consistent with Reset Password Page) */}
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-[#7367F0] opacity-5 border border-white/10 rotate-12"></div>
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-brand-500 opacity-5 rounded-[40px] border border-white/5 -rotate-12 border-dashed"></div>

        <div className="relative z-10 text-center max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L4 7L12 11L20 7L12 3Z" fill="#7367F0" />
              <path d="M4 11L12 15L20 11" stroke="#7367F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 15L12 19L20 15" stroke="#7367F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-3xl font-black text-white">ODI XTECH</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-8xl font-black text-[#7367F0] opacity-20 select-none">404</h1>
            <h2 className="text-3xl font-bold text-white tracking-tight">Page Not Found</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              We couldn’t find the page you are looking for. It might have been moved, deleted, or never existed!
            </p>
          </div>

          <div className="pt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-[#7367F0] hover:bg-[#685dd8] text-white px-10 py-4 rounded-lg font-bold shadow-lg shadow-[#7367F0]/20 transition-all hover:scale-[1.05] active:scale-95 text-base"
            >
              Back to Home
            </Link>
          </div>

          <div className="pt-12">
            <p className="text-xs font-bold text-gray-600">
              ODI XTECH Systems
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
