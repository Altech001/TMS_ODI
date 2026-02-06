import {
    ArrowRight,
    FileUp,
    MessageCircle,
    CheckCircle2,
    ClipboardList,
    Clock
} from "lucide-react";
import React from "react";

interface ActivityItem {
    id: string;
    user: string;
    action: string;
    target: string;
    time: string;
    type: "comment" | "upload" | "status" | "task";
    avatar?: string;
}

interface ActivityTimelineProps {
    activities: ActivityItem[];
    onViewAll?: () => void;
}

const getActivityIcon = (type: ActivityItem["type"]) => {
    const iconClasses = "w-4 h-4";
    switch (type) {
        case "comment":
            return <MessageCircle className={`${iconClasses} text-blue-500`} />;
        case "upload":
            return <FileUp className={`${iconClasses} text-purple-500`} />;
        case "status":
            return <CheckCircle2 className={`${iconClasses} text-green-500`} />;
        case "task":
            return <ClipboardList className={`${iconClasses} text-amber-500`} />;
        default:
            return <Clock className={`${iconClasses} text-gray-400`} />;
    }
};

const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
        case "comment":
            return "bg-blue-500/10 border-blue-500/30";
        case "upload":
            return "bg-purple-500/10 border-purple-500/30";
        case "status":
            return "bg-green-500/10 border-green-500/30";
        case "task":
            return "bg-amber-500/10 border-amber-500/30";
        default:
            return "bg-gray-500/10 border-gray-500/30";
    }
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, onViewAll }) => {
    return (
        <div className="bg-white dark:bg-[#1C1C1C] dark:border-white/5 p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                    Recent Activity
                </h2>
                <span className="text-[9px] font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded">
                    {activities.length}
                </span>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {activities.map((activity, index) => {
                    const isLast = index === activities.length - 1;

                    return (
                        <div key={activity.id} className="relative">
                            {/* Timeline Line */}
                            {!isLast && (
                                <div className="absolute left-[15px] top-9 bottom-[-16px] w-[2px] bg-gray-100 dark:bg-white/10" />
                            )}

                            <div className="flex gap-3">
                                {/* Icon Container */}
                                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 ${getActivityColor(activity.type)} flex items-center justify-center bg-white dark:bg-[#1C1C1C]`}>
                                    {getActivityIcon(activity.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-0.5">
                                    {/* User Name */}
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                                        {activity.user}
                                    </p>

                                    {/* Action */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                        {activity.action}{" "}
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                            {activity.target}
                                        </span>
                                    </p>

                                    {/* Time */}
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] text-gray-400">
                                            {activity.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* View All Button */}
            <button
                onClick={onViewAll}
                className="w-full mt-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg text-[10px] font-bold text-gray-500 hover:text-brand-500 uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 group"
            >
                View All
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};

export default ActivityTimeline;
