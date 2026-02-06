import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Loader2, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "../../icons";

type Step = "email" | "code" | "password" | "success";

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const { requestPasswordReset, resetPassword } = useAuth();

    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email) {
            setError("Please enter your email");
            return;
        }

        setIsLoading(true);
        try {
            await requestPasswordReset(email);
            setStep("code");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send reset code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            const nextInput = document.getElementById(`reset-code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            const prevInput = document.getElementById(`reset-code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = code.join("");
        if (otpCode.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }
        setError(null);
        setStep("password");
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newPassword || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!regex.test(newPassword)) {
            setError("Password must be at least 8 characters with uppercase, lowercase, number and special character");
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(email, code.join(""), newPassword);
            setStep("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
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
                <div className={`w-16 h-16 ${step === "success" ? "bg-green-500/10" : "bg-brand-500/10"} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    {step === "success" ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                        <KeyRound className="w-8 h-8 text-brand-500" />
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Step 1: Email */}
                {step === "email" && (
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Forgot Password? 🔐
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter your email and we'll send you a code to reset your password
                        </p>

                        <form onSubmit={handleEmailSubmit} className="pt-4 space-y-5 text-left">
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="info@gmail.com"
                                    className="rounded-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    "Send Reset Code"
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: OTP Code */}
                {step === "code" && (
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Enter Code 📬
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            We sent a 6-digit code to
                            <span className="block text-gray-900 dark:text-white font-bold mt-1">{email}</span>
                        </p>

                        <form onSubmit={handleCodeSubmit} className="pt-4">
                            <div className="flex justify-center gap-2 mb-6">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`reset-code-${index}`}
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
                                className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-brand-500/20 transition-all"
                            >
                                Continue
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 3: New Password */}
                {step === "password" && (
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            New Password 🔑
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Create a strong password for your account
                        </p>

                        <form onSubmit={handlePasswordSubmit} className="pt-4 space-y-5 text-left">
                            <div>
                                <Label>New Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        className="rounded-none"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <span
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                    >
                                        {showPassword ? (
                                            <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                        ) : (
                                            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    placeholder="Confirm new password"
                                    className="rounded-none"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Resetting...
                                    </span>
                                ) : (
                                    "Reset Password"
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === "success" && (
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Password Reset! ✅
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>

                        <button
                            onClick={() => navigate("/signin")}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-brand-500/20 transition-all mt-6"
                        >
                            Sign In Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
