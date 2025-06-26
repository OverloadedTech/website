"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, ExternalLink, ArrowLeft, Info, Star, Sparkles, Zap, Home } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ProjectsPage() {
  const router = useRouter()

  useEffect(() => {
    // Multiple methods to ensure scroll to top
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    // Immediate scroll
    scrollToTop()

    // Delayed scroll to handle any async content
    setTimeout(scrollToTop, 50)
    setTimeout(scrollToTop, 100)
    setTimeout(scrollToTop, 200)
  }, [])

  const handleBackToHome = () => {
    router.push("/")
    // Force scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 50)
  }

  return (
    <div className="main-bg relative overflow-hidden">
      {/* Animated background particles */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Floating orbs */}
      <div className="floating-orb orb-1"></div>
      <div className="floating-orb orb-2"></div>

      {/* Header */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={handleBackToHome}
              variant="outline"
              size="lg"
              className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 rounded-full hover-lift-stable"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-green-400 to-emerald-500 bg-clip-text text-transparent mb-6">
              My Projects
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-400">Backend projects and experiments</p>
          </div>
        </div>
      </section>

      {/* Notice */}
      <section className="py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <Alert className="glass border-yellow-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Info className="h-4 w-4 text-white" />
              </div>
              <AlertDescription className="text-yellow-200 text-lg">
                <strong>Developer's Note:</strong> Most projects here are experimental prototypes and learning
                exercises. Only Empty Character is production-ready and actively maintained.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </section>

      {/* Main Project */}
      <section className="py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Star className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gradient">Featured Project</h2>
          </div>

          <div className="card-enhanced rounded-3xl p-10 hover-lift-stable relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-2xl"></div>

            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-3xl font-bold text-gradient">Empty Character</h3>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
                    A comprehensive character management tool available as both mobile app and web application. Features
                    robust documentation, open-source codebase, and serves thousands of users worldwide.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                {["Mobile App", "Web App", "Cross-Platform", "Open-Source", "Free"].map((tag, index) => (
                  <Badge key={index} className="glass border-gray-500/30 text-gray-300 px-4 py-2 rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold px-6 py-3 rounded-full btn-glow hover-lift-stable"
                >
                  <Link href="https://emptycharacterapp.web.app/" target="_blank" rel="noopener noreferrer">
                    <Zap className="mr-2 h-4 w-4" />
                    Visit Website
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 px-6 py-3 rounded-full hover-lift-stable"
                >
                  <Link
                    href="https://play.google.com/store/apps/details?id=com.empty.character"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Google Play
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 px-6 py-3 rounded-full hover-lift-stable"
                >
                  <Link
                    href="https://github.com/OverloadedTech/emptycharacter-archive"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Source Archive
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prototype Projects */}
      <section className="py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-gray-400 mb-8">Experimental Projects & Prototypes</h2>

          <div className="grid md:grid-cols-2 gap-8 opacity-70">
            {[
              {
                title: "PC Optimizer (2017)",
                desc: "Batch script converted to .EXE with graphical interface for PC optimization",
                tags: ["Batch Script", "Desktop App"],
                status: "Prototype",
                color: "from-yellow-400 to-orange-500",
              },
              {
                title: "Multiplayer Gaming Platform (2021)",
                desc: "Online multiplayer gaming platform with backend services",
                tags: ["Backend Services", "Multiplayer"],
                status: "Prototype",
                color: "from-blue-400 to-cyan-500",
              },
              {
                title: "Mobile Operator App (2020)",
                desc: "Unofficial personal area app with backend integration (removed from store)",
                tags: ["Android", "API Integration"],
                status: "Archived",
                color: "from-purple-400 to-pink-500",
              },
              {
                title: "Various Backend Tools",
                desc: "Collection of backend utilities and development tools",
                tags: ["Node.js", "Utilities"],
                status: "Development",
                color: "from-green-400 to-emerald-500",
              },
            ].map((project, index) => (
              <div key={index} className="card-enhanced rounded-2xl p-8 hover-lift-stable">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-3 h-3 bg-gradient-to-r ${project.color} rounded-full`}></div>
                      <h4 className="text-xl font-bold text-gray-300">{project.title}</h4>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">{project.desc}</p>
                  </div>
                  <Badge variant="outline" className="border-gray-600 text-gray-500 ml-4">
                    {project.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} className="bg-gray-800/50 text-gray-500 border-0 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-6">Explore More on GitHub</h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Dive into my repositories for experimental tools, learning projects, and code snippets. Some gems might be
            hidden in there! <span className="emoji">💎</span>
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold px-10 py-4 rounded-full btn-glow hover-lift-stable text-lg"
            >
              <Link href="https://github.com/OverloadedTech" target="_blank" rel="noopener noreferrer">
                <Github className="mr-3 h-6 w-6" />
                Visit GitHub Profile
              </Link>
            </Button>

            <Button
              onClick={handleBackToHome}
              variant="outline"
              size="lg"
              className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 px-10 py-4 rounded-full hover-lift-stable text-lg"
            >
              <Home className="mr-3 h-6 w-6" />
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
