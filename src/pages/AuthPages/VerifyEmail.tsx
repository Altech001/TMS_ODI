import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

const VerifyEmail: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyOtp } = useAuth();

    const email = location.state?.email || "";

    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const otpCode = code.join("");
        if (otpCode.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }

        setIsLoading(true);

        try {
            await verifyOtp(email, otpCode);
            navigate("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        // TODO: Add resend OTP API call
        setTimeout(() => {
            setIsResending(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#25293C] flex items-center justify-center relative overflow-hidden font-primary">
            {/* Decorative Background Shapes */}
            <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-brand-500 opacity-5 border border-white/10 rotate-12"></div>
            <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-brand-500 opacity-5 rounded-[40px] border border-white/5 -rotate-12 border-dashed"></div>

            {/* Main Card */}
            <div className="w-full max-w-md bg-white dark:bg-[#2F3349] border border-gray-100 dark:border-white/5 p-10 relative z-10 animate-in fade-in zoom-in duration-500">
                <Link
                    to="/signin"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                </Link>

                {/* Icon */}
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8 text-brand-500" />
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Verify your email ✉️
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        We sent a verification code to
                        <span className="block text-gray-900 dark:text-white font-bold mt-1">{email || "your email"}</span>
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* OTP Input */}
                    <form onSubmit={handleSubmit} className="pt-4">
                        <div className="flex justify-center gap-2 mb-6">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`code-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                "Verify Email"
                            )}
                        </button>
                    </form>

                    <div className="text-sm pt-4">
                        <p className="text-gray-500">
                            Didn't get the mail?
                            <button
                                onClick={handleResend}
                                disabled={isResending}
                                className="text-brand-500 hover:text-brand-600 font-bold ml-1 transition-colors disabled:opacity-50"
                            >
                                {isResending ? "Sending..." : "Resend"}
                            </button>
                        </p>
                    </div>

                    <div className="text-sm">
                        <button
                            onClick={() => navigate("/")}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
