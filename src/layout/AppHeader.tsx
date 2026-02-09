import { useEffect, useRef, useState } from "react";
import { useFullscreen } from 'react-haiku';

import { FullscreenIcon, Minimize } from "lucide-react";
import { Link } from "react-router";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import { useSidebar } from "../context/SidebarContext";

// Hamburger Menu Icon Component
const HamburgerIcon = () => (
  <svg
    width="16"
    height="12"
    viewBox="0 0 16 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 1H15M1 6H15M1 11H15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const AppHeader: React.FC = () => {

  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Calculate the position where hamburger should be (at sidebar right border)
  const sidebarWidth = isExpanded ? 260 : 70;

  const documentRef = useRef<HTMLElement>(document.documentElement);

  const { isFullscreen, toggleFullscreen } = useFullscreen(documentRef);

  return (
    <header
      className="sticky top-0 flex w-full z-99999 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-white/[0.15]"
    >
      {/* Hamburger button positioned at sidebar right border */}
      <div
        className="fixed top-0 z-[99999] hidden lg:flex items-center justify-center transition-all duration-300"
        style={{
          left: `${sidebarWidth - 20}px`,
          height: "64px",
        }}
      >
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-white/[0.15] text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
        >
          {isExpanded ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L8 12L15 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <HamburgerIcon />
          )}
        </button>

      </div>

      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div
          className="flex items-center justify-between w-full gap-2 px-3 py-3 sm:gap-4 lg:justify-normal lg:px-0 lg:py-4"

        >
          {/* Mobile hamburger - only visible on mobile */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 hover:bg-[#2A2A2A] lg:hidden"
            style={{
              borderColor: "rgba(255, 255, 255, 0.15)",
              color: "rgba(255, 255, 255, 0.7)",
              backgroundColor: "transparent",
            }}
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <HamburgerIcon />
            )}
          </button>

          <Link to="/" className="lg:hidden">
            <span className="text-white font-semibold text-lg">TailAdmin</span>
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 rounded-lg z-99999 hover:bg-[#2A2A2A] lg:hidden"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <div
          className={`${isApplicationMenuOpen ? "flex" : "hidden"
            } items-center justify-between w-full gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize />
              ) : (
                <FullscreenIcon />
              )}
            </button>
            <NotificationDropdown />
            {/* Dark Mode Toggler */}
            <ThemeToggleButton />

          </div>

        </div>
      </div>
    </header>
  );
};

export default AppHeader;
