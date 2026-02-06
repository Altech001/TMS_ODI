import React from "react";

const ResetPassword: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#25293C] flex items-center justify-center relative overflow-hidden font-primary">
            {/* Decorative Background Shapes */}
            <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-[#7367F0] opacity-5 border border-white/10 rotate-12"></div>
            <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-brand-500 opacity-5 rounded-[40px] border border-white/5 -rotate-12 border-dashed"></div>
            <div className="absolute top-[40%] right-[20%] w-32 h-32 bg-white opacity-[0.02] rounded-2xl rotate-45 border border-white/20"></div>

            {/* Main Card */}
            <div className="w-full max-w-lg bg-white dark:bg-[#2F3349] border border-gray-100 dark:border-white/5 p-12 relative z-10 animate-in fade-in zoom-in duration-500 text-center">

                {/* Content */}
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                        Verify your email <span className="text-xl">✉️</span>
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                        Account activation link sent to your email address:
                        <span className="block text-gray-900 dark:text-white font-bold mt-1">yoo.doe@email.com</span>
                        Please follow the link inside to continue.
                    </p>

                    <div>
                        <button className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-95">
                            Skip For Now
                        </button>
                    </div>

                    <div className="text-sm">
                        <p className="text-gray-500">
                            Didn't get the mail?
                            <button className="text-brand-500 hover:text-brand-600 font-bold ml-1 transition-colors">
                                Resend
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
