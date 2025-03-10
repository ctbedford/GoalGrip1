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
  Bug,
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
            "flex items-center px-4 py-2 rounded-lg transition-colors cursor-pointer",
            active 
              ? "bg-blue-900 bg-opacity-60 text-blue-100"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          )}
        >
          <Icon className={cn("mr-3 h-5 w-5", active ? "text-blue-300" : "text-gray-500")} />
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
        <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-blue-900 bg-opacity-30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-gray-100 bg-clip-text text-transparent">GOAL:SYNC</h1>
          <p className="text-xs text-gray-400 mt-1">TARGET ACQUISITION SYSTEM</p>
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
            <Separator className="my-2 bg-gray-800" />
            <SidebarItem 
              icon={Bug} 
              label="Debug" 
              href="/debug" 
              active={location === "/debug"} 
            />
          </ul>
        </nav>
        
        <div className="p-5 border-t border-gray-800 bg-black bg-opacity-30">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-900 bg-opacity-60 rounded-md flex items-center justify-center text-blue-200 font-mono font-semibold border border-blue-700 shadow-inner shadow-blue-900/20">
              JS
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-100">John Smith</p>
              <div className="flex items-center mt-1">
                <div className="h-1.5 w-16 bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/2"></div>
                </div>
                <p className="text-xs text-blue-400 ml-2 font-mono">LVL 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-blue-900 bg-opacity-90 z-10 border-b border-gray-800">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-gray-100 bg-clip-text text-transparent">GOAL:SYNC</h1>
              <p className="text-xs text-gray-400">TARGET ACQUISITION</p>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-blue-200 hover:bg-blue-900 hover:bg-opacity-40">
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
                  <Separator className="my-2 bg-gray-800" />
                  <SidebarItem 
                    icon={Bug} 
                    label="Debug" 
                    href="/debug" 
                    active={location === "/debug"} 
                  />
                </ul>
              </nav>
              <Separator className="bg-gray-800"/>
              <div className="p-4 bg-black bg-opacity-30">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-900 bg-opacity-60 rounded-md flex items-center justify-center text-blue-200 font-mono font-semibold border border-blue-700 shadow-inner shadow-blue-900/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-100">John Smith</p>
                    <div className="flex items-center mt-1">
                      <div className="h-1.5 w-16 bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-blue-500 w-1/2"></div>
                      </div>
                      <p className="text-xs text-blue-400 ml-2 font-mono">LVL 3</p>
                    </div>
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
