import { FaBell, FaChevronDown } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/SearchBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { Link } from "react-router";
import { useTheme } from "@/hooks/useTheme";
import { useInstructor } from "@/hooks/useInstructor";
import { useAuth } from "@/hooks/useAuth";

const formatName = (name: string) => {
  const [firstName, ...rest] = name.split(" ");
  return `${firstName} ${rest.map((n) => n[0]).join(". ")}.`;
};

const InstructorNav = () => {
  const { instructor } = useInstructor();
  const { handleLogout } = useAuth();
  const { darkMode, setDarkMode } = useTheme();

  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const shouldShowSidebarTrigger = state === "collapsed" || isMobile;

  return (
    <nav
      className={cn(
        "bg-background text-foreground sticky top-0 right-0 z-[40] flex items-center justify-between border-b px-6 py-4",
        "shadow-sm dark:border-gray-800",
      )}
    >
      <div className="flex items-center gap-4">
        {shouldShowSidebarTrigger && (
          <>
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchBar placeholderText="Search courses..." />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <FaBell className="h-[1.2rem] w-[1.2rem]" />
              {instructor?.notifications.length > 0 && (
                <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                  {instructor.notifications.map((n) => !n.isRead).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2">
            <div className="my-2 px-2 py-1.5 text-sm font-semibold">
              Notifications
            </div>
            <Separator />
            {instructor?.notifications.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center text-sm">
                No new notifications
              </div>
            ) : (
              instructor?.notifications.map((notification, index) => (
                <HoverCard key={index}>
                  <HoverCardTrigger asChild>
                    <div className="hover:bg-accent cursor-pointer rounded p-3 text-sm">
                      {notification.title}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent>{notification.content}</HoverCardContent>
                </HoverCard>
              ))
            )}
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode((cur) => !cur)}
          className="border"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 p-6">
              <img
                src={instructor.picture}
                alt={instructor.fullName}
                className="h-8 w-8 rounded-full"
              />
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium">
                  {formatName(instructor.fullName)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {instructor.email}
                </span>
              </div>
              <FaChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 space-y-2 p-3" align="end">
            <DropdownMenuItem asChild>
              <Link
                to="/instructor/dashboard/settings"
                className="cursor-pointer"
              >
                ⚙️ Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>🔒 Privacy & Security</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive dark:text-red-500"
            >
              🚪 Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default InstructorNav;
