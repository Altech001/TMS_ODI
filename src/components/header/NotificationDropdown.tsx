import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { useNotifications } from "../../context/NotificationContext";
import { Bell, Clock, User } from "lucide-react";

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-10 w-10 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[8px] font-semibold text-white border-2 border-white dark:border-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <Bell className="w-5 h-5" />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800 px-2">
          <h5 className="text-sm font-bold text-gray-800 dark:text-white/90 uppercase tracking-widest">
            Notifications
          </h5>
          <span className="text-[10px] font-bold text-brand-500 bg-brand-500/5 px-2 py-0.5 rounded uppercase">
            {unreadCount} New
          </span>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto no-scrollbar flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Updating...</p>
            </div>
          ) : (!notifications || notifications.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Bell className="w-10 h-10 text-gray-200 dark:text-white/5" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All caught up!</p>
            </div>
          ) : (
            notifications?.map((notif) => (
              <li key={notif.id} className="relative group">
                <DropdownItem
                  onItemClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                    closeDropdown();
                  }}
                  className={`flex gap-4 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-all relative ${!notif.isRead ? 'bg-brand-500/[0.02]' : ''}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border ${!notif.isRead ? 'bg-brand-500 text-white border-brand-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-transparent'}`}>
                    <User className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold truncate leading-tight mb-1 ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {notif.title}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {!notif.isRead && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-500 rounded-full"></div>
                  )}
                </DropdownItem>
              </li>
            ))
          )}
        </ul>

        <Link
          to="/settings"
          onClick={closeDropdown}
          className="block px-4 py-3 mt-3 text-[10px] font-bold text-center text-gray-700 bg-gray-50 dark:bg-white/5 border border-transparent rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 dark:text-gray-400 transition-all uppercase tracking-widest"
        >
          View All Activity
        </Link>
      </Dropdown>
    </div>
  );
}
