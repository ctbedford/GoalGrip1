import React from "react";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Flag, 
  LineChart, 
  Award, 
  FileText, 
  BrainCircuit, 
  Target, 
  Brain, 
  Sparkles, 
  RefreshCcw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Mantra: React.FC = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center px-4 py-6">
      {/* Header Section */}
      <div className="text-center max-w-md mb-6">
        <div className="inline-block p-1.5 px-3 mb-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium tracking-wider uppercase">
          <span className="flex items-center">
            <BrainCircuit className="w-4 h-4 mr-1.5" />
            <span>GOAL:SYNC</span>
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Grokking Your Goals
        </h1>
        <p className="text-sm text-gray-300 leading-relaxed">
          Transform intentions into achievements through deep understanding and conscious progress.
        </p>
      </div>

      {/* Core Principles */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 shadow-xl mb-6 w-full max-w-md">
        <CardContent className="p-5 space-y-3">
          <h2 className="font-medium text-blue-300 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
            Three Principles for Mastery
          </h2>
          
          <div className="space-y-3 pt-1">
            <div className="flex items-start">
              <div className="h-8 w-8 rounded bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 border border-blue-800/40">
                <Brain className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-200 text-sm">Deep Understanding</p>
                <p className="text-xs text-gray-400">Don't just track tasks—understand why they matter to your growth journey.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-8 w-8 rounded bg-purple-900/30 flex items-center justify-center mr-3 mt-0.5 border border-purple-800/40">
                <Target className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-200 text-sm">Intentional Alignment</p>
                <p className="text-xs text-gray-400">Align each goal with your deeper purpose for natural motivation.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-8 w-8 rounded bg-emerald-900/30 flex items-center justify-center mr-3 mt-0.5 border border-emerald-800/40">
                <RefreshCcw className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-gray-200 text-sm">Conscious Iteration</p>
                <p className="text-xs text-gray-400">Treat each setback as data, not failure. Progress is a spiral, not a line.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-800 mt-4">
            <p className="text-xs text-center text-gray-500 italic">
              "To grok is to understand so thoroughly that the observer becomes a part of the observed."
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div className="w-full max-w-md">
        <h2 className="font-medium text-gray-300 mb-3 text-sm">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard">
            <Button variant="secondary" className="w-full flex items-center justify-start text-sm h-12 bg-blue-950/40 hover:bg-blue-900/30 text-blue-200 border border-blue-900/40">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/goals">
            <Button variant="secondary" className="w-full flex items-center justify-start text-sm h-12 bg-indigo-950/40 hover:bg-indigo-900/30 text-indigo-200 border border-indigo-900/40">
              <Flag className="h-4 w-4 mr-2" />
              Set Goals
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="secondary" className="w-full flex items-center justify-start text-sm h-12 bg-purple-950/40 hover:bg-purple-900/30 text-purple-200 border border-purple-900/40">
              <LineChart className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/achievements">
            <Button variant="secondary" className="w-full flex items-center justify-start text-sm h-12 bg-amber-950/40 hover:bg-amber-900/30 text-amber-200 border border-amber-900/40">
              <Award className="h-4 w-4 mr-2" />
              Achievements
            </Button>
          </Link>
          <Link href="/notepad">
            <Button variant="secondary" className="w-full col-span-2 flex items-center justify-center text-sm h-12 bg-emerald-950/40 hover:bg-emerald-900/30 text-emerald-200 border border-emerald-900/40">
              <FileText className="h-4 w-4 mr-2" />
              Open Reflection Notepad
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Remember Text */}
      <div className="mt-6 mb-1 text-center max-w-md">
        <p className="text-xs text-gray-400 italic">
          "The ultimate achievement is not the goal itself, but who you become through the journey."
        </p>
      </div>
    </div>
  );
};

export default Mantra;