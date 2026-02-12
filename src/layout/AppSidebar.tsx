import {
  AlignVerticalJustifyEndIcon,
  Calendar,
  ChevronDown,
  FileSpreadsheetIcon,
  Folder,
  Home,
  MessageCircleIcon,
  MonitorCheckIcon,
  PanelsTopLeft
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { Link, useLocation } from "react-router";

import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";
import { useSidebar } from "../context/SidebarContext";
import {
  HorizontaLDots
} from "../icons";
import OrganisationSwitcher from "./Organisations";
import UserWidget from "./UserWidget";

// Role hierarchy for access control
type Role = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  VIEWER: 1,
};

type NavItem = {

  name: string;
  icon: React.ReactNode;
  path?: string;
  pro?: boolean;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  minRole?: Role; // Minimum role required to see this item

};

// Check if user has access based on role hierarchy
const hasAccess = (userRole: Role | undefined, minRole: Role): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
};

// Employee/Member items - accessible by all authenticated users
const navItems: NavItem[] = [
  {
    icon: <Home />,
    name: "Dashboard",
    path: "/",
    minRole: "VIEWER",
  },
  {
    icon: <Folder />,
    name: "My Projects",
    path: "/projects",
    minRole: "MEMBER",
  },
  {
    icon: <Folder />,
    name: "Cashbooks",
    path: "/cashbooks",
    minRole: "MEMBER",
  },
  {
    icon: <FileSpreadsheetIcon />,
    name: "My Tasks",
    path: "/tasks",
    minRole: "MEMBER",
  },

  {
    icon: <AlignVerticalJustifyEndIcon />,
    name: "Presence",
    path: "/presence",
    minRole: "MEMBER",
  },
  {
    icon: <MonitorCheckIcon />,
    name: "Expenses",
    path: "/expenses",
    minRole: "MEMBER",
  },

  {
    icon: <Calendar />,
    name: "Personal Finance",
    path: "/personal-finance",
    minRole: "MEMBER",
  },

  {
    icon: <MessageCircleIcon />,
    name: "Meetings",
    path: "/planner",
    minRole: "MEMBER",
  },
  {
    icon: <PanelsTopLeft />,
    name: "Settings",
    path: "/settings",
    minRole: "VIEWER",
  },
];



// Tooltip component that uses position: fixed to avoid clipping
const FixedTooltip = ({ text, rect }: { text: string, rect: DOMRect | null }) => {
  if (!rect) return null;

  return (
    <div
      className="fixed z-[9999] px-3 py-1.5 bg-[#2A2A2A] border border-white/10 text-white text-xs font-semibold rounded-md shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200"
      style={{
        left: `calc(${rect.right}px + 12px)`,
        top: `${rect.top + rect.height / 2}px`,
        transform: 'translateY(-50%)'
      }}
    >
      <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#2A2A2A] border-l border-b border-white/10 rotate-45"></div>
      {text}
    </div>
  );
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const { isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();
  const location = useLocation();
  const pathname = location.pathname;

  // Sidebar should be "expanded" if explicitly expanded or if we're on mobile and it's open
  const effectivelyExpanded = isExpanded || isMobileOpen;

  // Get current user role from current organization in context
  const userRole = currentOrganization?.role as Role | undefined;

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: string;
    index: number;
  } | null>(null);

  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [hoveredText, setHoveredText] = useState<string>("");

  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname]
  );

  const handleSubmenuToggle = (index: number, menuType: string) => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
    );
  };

  // Filter items based on user role
  const filterItemsByRole = (items: NavItem[]): NavItem[] => {
    if (!isAuthenticated || !userRole) return [];
    return items.filter(item => !item.minRole || hasAccess(userRole, item.minRole));
  };

  const renderMenuItems = (items: NavItem[], menuType: string) => {
    const filteredItems = filterItemsByRole(items);

    if (filteredItems.length === 0) return null;

    return (
      <ul className="flex flex-col gap-1.5">
        {filteredItems.map((nav, index) => {
          const itemActive = nav.path ? isActive(nav.path) : false;
          const subMenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;

          return (
            <li key={nav.name} className="relative w-full">
              <div
                onMouseEnter={(e) => {
                  if (!effectivelyExpanded) {
                    setHoveredRect(e.currentTarget.getBoundingClientRect());
                    setHoveredText(nav.name);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredRect(null);
                  setHoveredText("");
                }}
              >
                {nav.subItems ? (
                  <button
                    onClick={() => handleSubmenuToggle(index, menuType)}
                    className={`flex items-center w-full transition-all duration-200 cursor-pointer rounded-none
                      ${subMenuOpen || itemActive
                        ? "bg-gray-100 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100  hover:text-gray-900 dark:hover:text-white"
                      } ${!effectivelyExpanded ? "justify-center w-11 h-11 px-0 mx-auto" : "justify-between px-3 py-4 gap-3"}`}
                  >
                    <span className={`flex items-center justify-center size-6 shrink-0 transition-colors ${itemActive || subMenuOpen ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"}`}>
                      {React.isValidElement(nav.icon) ?
                        React.cloneElement(nav.icon as React.ReactElement, { size: 20, strokeWidth: itemActive || subMenuOpen ? 2.2 : 1.8 } as any) :
                        nav.icon
                      }
                    </span>
                    {effectivelyExpanded && (
                      <>
                        <span className="whitespace-nowrap flex-1 text-left text-sm font-medium">{nav.name}</span>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform duration-200 ${subMenuOpen ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  nav.path && (
                    <Link
                      to={nav.path}
                      className={`flex items-center w-full transition-all duration-200 rounded-none
                        ${isActive(nav.path)
                          ? "bg-brand-500 text-brand-100 dark:text-white dark:bg-brand-500"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-50/10 hover:text-gray-900 dark:hover:text-white"
                        } ${!effectivelyExpanded ? "justify-center w-11 h-11 px-0 mx-auto" : "justify-start px-3 py-2.5 gap-3"}`}
                    >
                      <span className={`flex items-center justify-center size-6 shrink-0 transition-colors ${isActive(nav.path) ? "text-brand-100 dark:text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"}`}>
                        {React.isValidElement(nav.icon) ?
                          React.cloneElement(nav.icon as React.ReactElement, { size: 20, strokeWidth: isActive(nav.path) ? 2.2 : 1.8 } as any) :
                          nav.icon
                        }
                      </span>
                      {effectivelyExpanded && (
                        <>
                          <span className="whitespace-nowrap text-sm font-medium">{nav.name}</span>
                          {nav.new && (
                            <span className="ml-auto px-2 py-0.5 text-[9px] font-bold rounded bg-blue-500/10 text-blue-400 uppercase tracking-wider">New</span>
                          )}
                          {nav.pro && (
                            <span className="ml-auto px-2 py-0.5 text-[9px] font-bold rounded bg-purple-500/10 text-purple-400 uppercase tracking-wider">Pro</span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                )}
              </div>

              {nav.subItems && effectivelyExpanded && subMenuOpen && (
                <ul className="mt-1 space-y-1 ml-9 animate-in slide-in-from-top-1 duration-200">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${isActive(subItem.path)
                          ? "text-white"
                          : "text-gray-500 hover:text-white"
                          }`}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // Check if section should be visible based on any item being accessible
  const shouldShowSection = (items: NavItem[]): boolean => {
    return filterItemsByRole(items).length > 0;
  };

  return (
    <>
      <aside
        className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen transition-all duration-300 ease-in-out z-50
          ${effectivelyExpanded ? "w-[260px] px-4" : "w-[70px] px-0"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 bg-white border-r border-gray-200 dark:border-white/[0.08]`}
      >
        <div className={`py-6 flex ${!effectivelyExpanded ? "justify-center" : "px-3 justify-start"}`}>
          <Link to="/">
            <span className="text-gray-900 dark:text-white font-bold text-xl tracking-tight">
              {effectivelyExpanded ? "TMS" : "TM"}
            </span>
          </Link>
        </div>

        <OrganisationSwitcher isExpanded={effectivelyExpanded} />


        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1 pb-4">
          <nav className="flex flex-col gap-7 mt-4">
            {/* Home Section - Always visible for authenticated users */}
            {shouldShowSection(navItems) && (
              <div>
                <h2 className={`mb-4 text-[12px] uppercase  text-gray-900 dark:text-white font-bold transition-opacity duration-300 ${!effectivelyExpanded ? "text-center opacity-40 px-0" : "px-3 opacity-50"}`} >
                  {effectivelyExpanded ? "Home" : <HorizontaLDots className="size-4 mx-auto" />}
                </h2>
                {renderMenuItems(navItems, "home")}
              </div>
            )}
          </nav>
        </div>
        <UserWidget isExpanded={effectivelyExpanded} />
      </aside>

      {/* Tooltip rendered outside aside to avoid clipping by overflow-y-auto */}
      {!effectivelyExpanded && !isMobileOpen && (
        <FixedTooltip text={hoveredText} rect={hoveredRect} />
      )}
    </>
  );
};

export default AppSidebar;