import React from "react";
import { Link } from "react-router";
import { ShieldX, ArrowLeft } from "lucide-react";

const Unauthorized: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldX className="w-10 h-10 text-red-500" />
                </div>

                {/* Content */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Access Denied
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>

                {/* Action */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold uppercase tracking-widest text-xs rounded-lg shadow-lg shadow-brand-500/20 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
