import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";
import {
  MessagesSquare,
  Settings,
  Users,
  FileText,
  BarChart,
  BookOpen,
} from "lucide-react";
import logoImg from "@/assets/images/LOGO.png";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType;
}

const urlPrefix = "/admin/dashboard";

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: urlPrefix,
    icon: BarChart,
  },
  {
    title: "Manage Courses",
    url: `${urlPrefix}/courses`,
    icon: BookOpen,
  },
  {
    title: "Add New Course",
    url: `${urlPrefix}/add-course`,
    icon: FileText,
  },
  {
    title: "Student Assignments",
    url: `${urlPrefix}/assignments`,
    icon: BookOpen,
  },
  {
    title: "Classroom & Groups",
    url: `${urlPrefix}/chat`,
    icon: MessagesSquare,
  },
  {
    title: "Student Management",
    url: `${urlPrefix}/students`,
    icon: Users,
  },
  {
    title: "Instructor Management",
    url: `${urlPrefix}/instructors`,
    icon: Users,
  },
  {
    title: "Admin Management",
    url: `${urlPrefix}/admins`,
    icon: Users,
  },
  {
    title: "Settings",
    url: `${urlPrefix}/settings`,
    icon: Settings,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const isActive = (url: string): boolean => location.pathname === url;

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between px-5 py-5">
        <Link to={"/admin/dashboard/"}>
          <img src={logoImg} width={50} alt="Logo" className="-translate-x-3" />
        </Link>
        <SidebarTrigger>
          <svg
            className="size-5"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_2574_757)">
              <path
                d="M3 5C3 4.44772 3.44772 4 4 4H20C20.5523 4 21 4.44772 21 5C21 5.55228 20.5523 6 20 6H4C3.44772 6 3 5.55228 3 5ZM9 12C9 11.4477 9.44772 11 10 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H10C9.44771 13 9 12.5523 9 12ZM3 19C3 18.4477 3.44772 18 4 18H20C20.5523 18 21 18.4477 21 19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19Z"
                fill="#222222"
              />
            </g>
            <defs>
              <clipPath id="clip0_2574_757">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarSeparator className="-mt-[10px] -ml-[-1px] bg-blue-300/30" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="text-md py-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="rounded-sm border border-transparent px-4 hover:data-[active=true]:border-transparent dark:data-[active=true]:border-blue-300/30"
                    isActive={isActive(item.url)}
                    onClick={() => setOpenMobile(false)}
                    size="lg"
                    asChild
                  >
                    <Link to={item.url} className="flex items-center space-x-2">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
