import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Flag, 
  LineChart, 
  Award, 
  Settings,
  Menu,
  User,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active }: SidebarItemProps) => {
  return (
    <li className="mb-2">
      <Link href={href}>
        <div
          className={cn(
            "flex items-center px-4 py-2 text-gray-700 rounded-lg transition-colors cursor-pointer",
            active 
              ? "bg-gray-800 text-white"
              : "hover:bg-gray-800 hover:text-gray-200"
          )}
        >
          <Icon className={cn("mr-3 h-5 w-5", active ? "text-white" : "text-gray-400")} />
          <span>{label}</span>
        </div>
      </Link>
    </li>
  );
};

export const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar for desktop */}
      <div className={cn(
        "bg-gray-900 shadow-xl w-64 flex-shrink-0 border-r border-gray-800",
        isMobile ? "hidden" : "flex flex-col"
      )}>
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-gray-100">Goal Tracker</h1>
        </div>
        
        <nav className="flex-1 p-4">
          <ul>
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              href="/" 
              active={location === "/"} 
            />
            <SidebarItem 
              icon={Flag} 
              label="My Goals" 
              href="/goals" 
              active={location === "/goals"} 
            />
            <SidebarItem 
              icon={LineChart} 
              label="Analytics" 
              href="/analytics" 
              active={location === "/analytics"} 
            />
            <SidebarItem 
              icon={Award} 
              label="Achievements" 
              href="/achievements" 
              active={location === "/achievements"} 
            />
            <SidebarItem 
              icon={Settings} 
              label="Settings" 
              href="/settings" 
              active={location === "/settings"} 
            />
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-100 font-semibold">
              JS
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-200">John Smith</p>
              <p className="text-xs text-gray-400">Level 3 Achiever</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-gray-900 z-10 border-b border-gray-800">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-gray-100">Goal Tracker</h1>
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-gray-200">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="bg-gray-900 border-b border-gray-800 pb-2">
              <nav className="p-2">
                <ul>
                  <SidebarItem 
                    icon={LayoutDashboard} 
                    label="Dashboard" 
                    href="/" 
                    active={location === "/"} 
                  />
                  <SidebarItem 
                    icon={Flag} 
                    label="My Goals" 
                    href="/goals" 
                    active={location === "/goals"} 
                  />
                  <SidebarItem 
                    icon={LineChart} 
                    label="Analytics" 
                    href="/analytics" 
                    active={location === "/analytics"} 
                  />
                  <SidebarItem 
                    icon={Award} 
                    label="Achievements" 
                    href="/achievements" 
                    active={location === "/achievements"} 
                  />
                  <SidebarItem 
                    icon={Settings} 
                    label="Settings" 
                    href="/settings" 
                    active={location === "/settings"} 
                  />
                </ul>
              </nav>
              <Separator className="bg-gray-800"/>
              <div className="p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-100 font-semibold">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-200">John Smith</p>
                    <p className="text-xs text-gray-400">Level 3 Achiever</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className={cn(
          "flex-1 p-4 md:p-6 overflow-y-auto bg-gray-950 text-gray-200",
          isMobile && "pt-16"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};
