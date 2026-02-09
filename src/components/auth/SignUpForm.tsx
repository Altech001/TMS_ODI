import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function SignUpForm() {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [organizationName, setOrganizationName] = useState("");

    const validatePassword = (pwd: string): boolean => {
        // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(pwd);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!name || !email || !password || !organizationName) {
            setError("Please fill in all fields");
            return;
        }

        if (!isChecked) {
            setError("Please agree to the Privacy Policy & Terms");
            return;
        }

        if (!validatePassword(password)) {
            setError("Password must be at least 8 characters with uppercase, lowercase, number and special character");
            return;
        }

        setIsLoading(true);

        try {
            await signup(email, password, name, organizationName);
            // Redirect to verify email page or dashboard
            navigate("/verify-email", { state: { email } });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1">
            <div className="w-full max-w-md pt-10 mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                    <ChevronLeftIcon className="size-5" />
                    Back to dashboard 👋
                </Link>
            </div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-black text-gray-900 dark:text-white text-xl tracking-tight">
                            Create your account
                        </h1>
                        <p className="p-4"></p>
                    </div>
                    <div>
                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                <div>
                                    <Label>Full Name <span className="text-error-500">*</span></Label>
                                    <Input
                                        placeholder="John Doe"
                                        className="rounded-none capitalize"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Email <span className="text-error-500">*</span></Label>
                                    <Input
                                        type="email"
                                        placeholder="info@gmail.com"
                                        className="rounded-none"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Organization Name <span className="text-error-500">*</span></Label>
                                    <Input
                                        placeholder="My Startup"
                                        className="rounded-none"
                                        value={organizationName}
                                        onChange={(e) => setOrganizationName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Password <span className="text-error-500">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a password"
                                            className="rounded-none"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                    <p className="mt-1.5 text-[10px] text-gray-400">
                                        Min 8 chars, uppercase, lowercase, number & special character
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                                    <span className="block font-normal text-gray-500 text-xs">
                                        I agree to the <Link to="/terms" className="text-brand-500 hover:underline text-xs">Privacy Policy & Terms</Link>
                                    </span>
                                </div>
                                <div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20 py-3.5 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        size="sm"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating account...
                                            </span>
                                        ) : (
                                            "Sign Up"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm font-normal text-gray-500">
                                Already have an account? {" "}
                                <Link
                                    to="/signin"
                                    className="text-brand-500 hover:text-brand-600 font-semibold"
                                >
                                    SignIn
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
