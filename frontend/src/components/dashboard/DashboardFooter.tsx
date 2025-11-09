"use client";

import { useState, useEffect } from "react";
import { HeartPulse } from "lucide-react";

interface DashboardFooterProps {
  isCollapsed: boolean;
}

export function DashboardFooter({ isCollapsed }: DashboardFooterProps) {
const [apiHealth, setApiHealth] = useState("unknown");
const softFlowVersion = "0.5.0";

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/health`);
        if (response.ok) {
          setApiHealth("ok");
        } else {
          setApiHealth("down");
        }
      } catch (error) {
        console.error("Failed to fetch API health:", error);
        setApiHealth("down");
      }
    };

    checkApiHealth();
    // const interval = setInterval(checkApiHealth, 30000); // Check every 30 seconds
    // return () => clearInterval(interval);
  }, []);

  const healthColor = apiHealth === "ok" ? "text-green-500" : "text-red-500";

  return (
    <footer className={`flex h-10 items-center justify-between border-t bg-muted/40 px-4 text-sm lg:h-[40px] lg:px-6 fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${isCollapsed ? 'md:ml-[60px]' : 'md:ml-[220px] lg:ml-[280px]'}`}>
      <div className="flex items-center gap-2">
        <HeartPulse className={`h-4 w-4 ${healthColor}`} />
        <span>API Status: <span className="font-semibold">{apiHealth}</span></span>
      </div>
      <div>
        SoftFlow Version: <span className="font-semibold">{softFlowVersion}</span>
      </div>
    </footer>
  );
}
