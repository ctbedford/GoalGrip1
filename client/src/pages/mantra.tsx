import React from "react";
import { Link } from "wouter";
import { ArrowRight, Sparkles, Zap, Brain, Target, BarChart3, Gem, RefreshCcw, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Mantra: React.FC = () => {
  return (
    <div className="px-4 py-6 md:px-6 md:py-10 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <div className="inline-block p-1.5 px-3 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium tracking-wider uppercase">
          <span className="flex items-center">
            <BrainCircuit className="w-4 h-4 mr-1.5" />
            <span>GOAL:SYNC Mindset</span>
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Grokking Your Path to Excellence
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          A mindful approach to transforming intentions into meaningful achievements through deep understanding and conscious progress.
        </p>
      </div>

      {/* Main Mantra Section */}
      <div className="space-y-16">
        {/* Core Mantra Principles */}
        <section className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-100 mb-6 flex items-center">
            <Sparkles className="mr-3 h-7 w-7 text-blue-400" />
            <span>Core Principles of Grokking</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 shadow-xl hover:shadow-blue-900/5 hover:border-blue-900/30 transition-all group overflow-hidden relative">
              <CardContent className="p-6">
                <div className="absolute -right-3 -top-3 w-16 h-16 bg-blue-500 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>
                <div className="h-12 w-12 rounded-lg bg-blue-900/30 flex items-center justify-center mb-4 border border-blue-800/40 group-hover:border-blue-700/40 transition-colors">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2 group-hover:text-blue-300 transition-colors">Deep Understanding</h3>
                <p className="text-gray-400 mb-4 text-sm">
                  Fully immerse yourself in the purpose and meaning of each goal. Don't just track tasks—understand why they matter to your growth journey.
                </p>
                <p className="text-xs font-medium text-blue-400">
                  "To grok is to understand so thoroughly that the observer becomes a part of the observed."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 shadow-xl hover:shadow-purple-900/5 hover:border-purple-900/30 transition-all group overflow-hidden relative">
              <CardContent className="p-6">
                <div className="absolute -right-3 -top-3 w-16 h-16 bg-purple-500 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>
                <div className="h-12 w-12 rounded-lg bg-purple-900/30 flex items-center justify-center mb-4 border border-purple-800/40 group-hover:border-purple-700/40 transition-colors">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2 group-hover:text-purple-300 transition-colors">Intentional Alignment</h3>
                <p className="text-gray-400 mb-4 text-sm">
                  Align each goal with your deeper purpose. When goals are extensions of your authentic self, motivation flows naturally.
                </p>
                <p className="text-xs font-medium text-purple-400">
                  "Set goals that pull you forward rather than push you through obligation."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-900/30 transition-all group overflow-hidden relative">
              <CardContent className="p-6">
                <div className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>
                <div className="h-12 w-12 rounded-lg bg-emerald-900/30 flex items-center justify-center mb-4 border border-emerald-800/40 group-hover:border-emerald-700/40 transition-colors">
                  <RefreshCcw className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2 group-hover:text-emerald-300 transition-colors">Conscious Iteration</h3>
                <p className="text-gray-400 mb-4 text-sm">
                  Embrace the cycle of setting, refining, and evolving your goals. Treat each setback as data, not failure.
                </p>
                <p className="text-xs font-medium text-emerald-400">
                  "Progress is not linear—it's a dance of advancement and reflection."
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Daily Practice */}
        <section className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-100 mb-6 flex items-center">
            <Zap className="mr-3 h-7 w-7 text-purple-400" />
            <span>Daily Practice Framework</span>
          </h2>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-xl p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 border border-blue-800/40">
                    <span className="text-blue-400 font-medium">1</span>
                  </div>
                  <h3 className="text-lg font-medium text-white">Morning Reflection</h3>
                </div>
                <p className="text-gray-400 text-sm pl-11">
                  Begin each day by connecting with your goals. Visualize not just completing tasks, but experiencing the deeper purpose behind them.
                </p>
                <div className="pl-11 pt-1">
                  <p className="text-xs italic text-gray-500 border-l-2 border-blue-800/50 pl-3 py-1">
                    "How will today's actions bring me closer to understanding my true potential?"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center mr-3 border border-purple-800/40">
                    <span className="text-purple-400 font-medium">2</span>
                  </div>
                  <h3 className="text-lg font-medium text-white">Mindful Progress</h3>
                </div>
                <p className="text-gray-400 text-sm pl-11">
                  As you log progress, pause to appreciate the significance of each step. Quality of engagement matters more than quantity of tasks.
                </p>
                <div className="pl-11 pt-1">
                  <p className="text-xs italic text-gray-500 border-l-2 border-purple-800/50 pl-3 py-1">
                    "What did I learn through this progress that I couldn't have known before starting?"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center mr-3 border border-amber-800/40">
                    <span className="text-amber-400 font-medium">3</span>
                  </div>
                  <h3 className="text-lg font-medium text-white">Resistance Awareness</h3>
                </div>
                <p className="text-gray-400 text-sm pl-11">
                  When you feel resistance toward a goal, don't force it. Instead, explore the resistance—it often contains wisdom about alignment.
                </p>
                <div className="pl-11 pt-1">
                  <p className="text-xs italic text-gray-500 border-l-2 border-amber-800/50 pl-3 py-1">
                    "Is this resistance signaling misalignment, or simply the necessary tension of growth?"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-900/30 flex items-center justify-center mr-3 border border-emerald-800/40">
                    <span className="text-emerald-400 font-medium">4</span>
                  </div>
                  <h3 className="text-lg font-medium text-white">Evening Integration</h3>
                </div>
                <p className="text-gray-400 text-sm pl-11">
                  End each day by reviewing not just what you did, but how it transformed your understanding of your path and purpose.
                </p>
                <div className="pl-11 pt-1">
                  <p className="text-xs italic text-gray-500 border-l-2 border-emerald-800/50 pl-3 py-1">
                    "How have today's efforts expanded my conception of what's possible?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Higher Purpose */}
        <section className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-100 mb-6 flex items-center">
            <Gem className="mr-3 h-7 w-7 text-amber-400" />
            <span>Transcending Goal Achievement</span>
          </h2>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-xl p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-300 mb-6 leading-relaxed">
                GOAL:SYNC isn't merely about tracking metrics—it's about developing a profound relationship with your aspirations. When you truly grok your goals:
              </p>

              <ul className="space-y-5">
                <li className="flex">
                  <div className="mr-3 mt-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800/40">
                      <span className="text-blue-400 text-xs">✦</span>
                    </div>
                  </div>
                  <p className="text-gray-400">
                    <span className="text-blue-300 font-medium">Your identity evolves</span> – Goals become less about doing and more about becoming. Each achievement integrates into who you are.
                  </p>
                </li>
                <li className="flex">
                  <div className="mr-3 mt-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-800/40">
                      <span className="text-purple-400 text-xs">✦</span>
                    </div>
                  </div>
                  <p className="text-gray-400">
                    <span className="text-purple-300 font-medium">Resistance transforms into curiosity</span> – Challenges become opportunities to deepen your understanding rather than obstacles to overcome.
                  </p>
                </li>
                <li className="flex">
                  <div className="mr-3 mt-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-900/30 flex items-center justify-center border border-emerald-800/40">
                      <span className="text-emerald-400 text-xs">✦</span>
                    </div>
                  </div>
                  <p className="text-gray-400">
                    <span className="text-emerald-300 font-medium">You access flow states more easily</span> – When goals align with your deeper nature, the boundary between effort and enjoyment dissolves.
                  </p>
                </li>
              </ul>

              <div className="mt-8 text-center py-4">
                <p className="text-gray-300 font-medium mb-2">The ultimate achievement is not the goal itself, but who you become through grokking the journey.</p>
                <p className="text-sm text-gray-500 italic">"The master has failed more times than the beginner has even tried."</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Ready to begin your journey?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Apply these principles as you work with GOAL:SYNC to transform how you approach achievement and personal development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-6 h-auto">
                Enter Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/goals">
              <Button size="lg" variant="outline" className="border-blue-800 text-blue-300 hover:bg-blue-900/30 font-medium px-8 py-6 h-auto">
                Set Your First Goal
                <Target className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mantra;