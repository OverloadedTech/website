"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Github,
  Mail,
  Server,
  Code,
  Database,
  Terminal,
  Sparkles,
  Zap,
  Rocket,
  Linkedin,
  Monitor,
  Smartphone,
  Globe,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function HomePage() {
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

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 px-4">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        ></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            {/* Status badge with pulse effect */}
            <div className="inline-flex items-center gap-3 glass px-6 py-3 rounded-full border border-green-500/30 hover-lift-stable">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-pulse-ring"></div>
              </div>
              <span className="text-sm text-green-400 font-medium">Say hello!</span>
              <Sparkles className="w-4 h-4 text-green-400" />
            </div>

            {/* Main title with stunning gradient */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-white via-green-400 to-emerald-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%] leading-tight">
                OverloadedTech
              </h1>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-shimmer"></div>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-purple">Luca Zani's Digital Space</h2>

            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed px-4">
                Upcoming Software Engineer, Tinkerer, Investor (and student) building with
                <span className="text-gradient font-semibold"> Python, Node.js, C++, and Rust</span>
              </p>

              <div className="flex flex-wrap justify-center gap-4 text-sm">                <div className="glass px-4 py-2 rounded-full border border-green-500/20">
                  <span className="text-green-400">
                    <span className="emoji">🚀</span> Online since 1 Aug 2021
                  </span>
                </div>                <div className="glass px-4 py-2 rounded-full border border-purple-500/20">
                  <span className="text-purple-400">
                    <span className="emoji">⚡</span> Version 2.3
                  </span>
                </div>
                <div className="glass px-4 py-2 rounded-full border border-blue-500/20">
                  <span className="text-blue-400">
                    <span className="emoji">🔧</span> Last Compiled on June 26, 2025
                  </span>
                </div>
                <div className="glass px-4 py-2 rounded-full border border-orange-500/20">
                  <span className="text-orange-400">
                    <span className="emoji">⚙️</span> Made with Next.js
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced CTA buttons */}
            <div className="flex flex-wrap justify-center gap-6 pt-8">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold px-8 py-4 rounded-full btn-glow hover-lift-stable neon-green"
              >
                <Link href="/projects">
                  <Rocket className="mr-2 h-5 w-5" />
                  Explore Projects
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 font-semibold px-8 py-4 rounded-full hover-lift-stable"
              >
                <Link href="https://github.com/OverloadedTech" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-5 w-5" />
                  GitHub Profile
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="glass border-blue-500/30 text-blue-200 hover:bg-blue-500/10 font-semibold px-8 py-4 rounded-full hover-lift-stable"
              >
                <Link href="https://www.linkedin.com/in/overloadedtech/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-5 w-5" />
                  LinkedIn
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section with enhanced cards */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gradient mb-4">What I Work With</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-enhanced rounded-2xl p-8 hover-lift-stable group">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:animate-glow">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gradient mb-3">Backend Development</h4>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Building server-side applications, APIs, and databases. Working with Python, Node.js, C++, and Rust to
                create reliable backend systems.
              </p>
            </div>

            <div className="card-enhanced rounded-2xl p-8 hover-lift-stable group">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:animate-glow">
                  <Server className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gradient-purple mb-3">System Tinkering</h4>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Experimenting with system architecture, learning about distributed systems, and figuring out how to make
                things work together.
              </p>
            </div>

            <div className="card-enhanced rounded-2xl p-8 hover-lift-stable group">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:animate-glow">
                  <Terminal className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                  DevOps Learning
                </h4>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Learning deployment strategies, monitoring systems, and automation. Still figuring out the best
                practices but enjoying the journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Timeline with enhanced styling */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gradient mb-4">My Coding Journey</h3>
            <p className="text-xl text-gray-400">From first experiments to current projects</p>
          </div>

          <div className="space-y-8">
            {[
              {
                year: "2017",
                title: "First Software",
                desc: "Created PC Optimizer - a batch script with a GUI. My first attempt at making something useful for others, shared with friends and family.",
                color: "from-yellow-400 to-orange-500",
                icon: Monitor,
              },
              {
                year: "2020",
                title: "Mobile Experiments",
                desc: "Built Android apps that reached 30,000+ users. Learned about mobile development and backend integration through trial and error.",
                color: "from-green-400 to-emerald-500",
                icon: Smartphone,
              },
              {
                year: "2021",
                title: "Tech Exploration",
                desc: "Released Empty Character app and experimented with different technologies. Started exploring cryptocurrency tech and multiplayer systems.",
                color: "from-blue-400 to-cyan-500",
                icon: Globe,
              },
              {
                year: "2022-Present",
                title: "Backend Focus",
                desc: "Focusing on backend development and system design. Learning new languages, working on personal projects, and improving my skills daily.",
                color: "from-purple-400 to-pink-500",
                icon: Wrench,
              },
            ].map((item, index) => {
              const IconComponent = item.icon

              return (
                <div key={index} className="card-enhanced rounded-2xl p-8 hover-lift-stable">
                  <div className="flex items-start gap-6">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`bg-gradient-to-r ${item.color} text-white border-0 px-3 py-1`}>
                          {item.year}
                        </Badge>
                        <h4 className="text-2xl font-bold text-white">{item.title}</h4>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Projects Preview with stunning effects */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gradient mb-4">My Projects</h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Check out what I've been working on</p>
          </div>

          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold px-12 py-6 rounded-full btn-glow hover-lift-stable text-lg"
            >
              <Link href="/projects">
                <Zap className="mr-3 h-6 w-6" />
                View All Projects
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section with glass morphism */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold text-gradient mb-4">About Me</h3>
          </div>
          <div className="card-enhanced rounded-3xl p-12 text-center hover-lift-stable">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-8 flex items-center justify-center animate-glow">
              <Code className="h-12 w-12 text-white" />
            </div>

            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
              Hey! I'm <span className="text-gradient font-semibold">Luca Zani</span>, a{" "}
              {new Date().getFullYear() - (new Date() < new Date(new Date().getFullYear(), 7, 18) ? 2009 : 2008)}
              -year-old Italian upcoming software engineer (and student) born on August 18, 2008.
            </p>

            <p className="text-lg text-gray-400 leading-relaxed">
              I am mainly a backend developer, a tinkerer around the world of 3D printing, a student and an investor. When I'm not building backend systems or experimenting with new tech, I'm listening to music or learning something tech-related.
            </p>
          </div>       </div>
      </section>

      {/* Contact Section with enhanced styling */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-12">
            <h3 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Let's Connect! <span className="emoji">🚀</span>
            </h3>
          </div>

          <div className="card-enhanced rounded-3xl p-12 mb-12 hover-lift-stable">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-glow">
              <Mail className="h-10 w-10 text-white" />
            </div>

            <p className="text-xl text-gray-300 mb-6">
              Want to chat about code or collaborate? Reach out at{" "}
              <Link href="mailto:luca@lucazani.com" className="text-gradient font-semibold hover:underline">
                luca@lucazani.com
              </Link>
            </p>

            <div className="glass px-8 py-4 rounded-full border border-green-500/30 inline-block mb-8">
              <span className="text-green-400 font-semibold text-lg">
                <span className="emoji">✨</span> Open for collaborations
              </span>
            </div>

            <p className="text-gray-400 mb-8">
              Whether it's backend development, project ideas, or just tech discussions - I'm always excited to connect
              with fellow developers and learn from others.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Button
                asChild
                variant="outline"
                className="glass border-blue-500/30 text-blue-200 hover:bg-blue-500/10 font-semibold px-8 py-3 rounded-full hover-lift-stable"
              >
                <Link href="https://www.linkedin.com/in/overloadedtech/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-5 w-5" />
                  Connect on LinkedIn
                </Link>
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              <p>Official responses only from luca@lucazani.com</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="card-enhanced rounded-2xl p-8">
              <h4 className="text-green-400 font-bold text-lg mb-4">
                <span className="emoji">✅</span> Let's discuss:
              </h4>
              <ul className="text-gray-300 space-y-2 text-left">
                <li>• Backend development & system design</li>
                <li>• Project collaboration opportunities</li>
                <li>• Technical challenges & solutions</li>
                <li>• Code reviews & learning together</li>
                <li>• Career advice & experiences</li>
              </ul>
            </div>

            <div className="card-enhanced rounded-2xl p-8">
              <h4 className="text-red-400 font-bold text-lg mb-4">
                <span className="emoji">❌</span> Please skip:
              </h4>
              <ul className="text-gray-300 space-y-2 text-left">
                <li>• Crypto investment schemes</li>
                <li>• Dropshipping course offers</li>
                <li>• Generic SEO services</li>
                <li>• Spam & promotional content</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <Button
              asChild
              variant="outline"
              className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 px-6 py-3 rounded-full hover-lift-stable"
            >
              <Link href="https://t.me/OverloadedTechInfo" target="_blank" rel="noopener noreferrer">
                <span className="mr-2 emoji">📱</span>
                Telegram Channel
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 px-6 py-3 rounded-full hover-lift-stable"
            >
              <Link href="https://blog.lucazani.com/" target="_blank" rel="noopener noreferrer">
                <span className="mr-2 emoji">📝</span>
                My Blog Archive
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 px-6 py-3 rounded-full hover-lift-stable"
            >
              <Link href="https://status.lucazani.com/" target="_blank" rel="noopener noreferrer">
                <Server className="mr-2 h-4 w-4" />
                System Status
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer with gradient */}
      <footer className="py-12 px-4 border-t border-gray-800/50 relative">
        <div className="container mx-auto max-w-6xl text-center relative">
          <p className="text-gray-400 mb-6 text-lg">
            MIT License {new Date().getFullYear()} Luca Zani - Open source and built with{" "}
            <span className="emoji">❤️</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="glass border-green-500/30 text-green-300 hover:bg-green-500/10 rounded-full hover-lift-stable"
            >
              <Link href="https://github.com/OverloadedTech/website" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View Source Code
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="glass border-gray-600/30 text-gray-300 hover:bg-white/10 rounded-full"
            >
              <Link href="/license">View License</Link>
            </Button>
          </div>
          {/* Legacy Site Info */}
          <div className="mt-8 pt-6 border-t border-gray-800/50">
            <p className="text-gray-500 mb-4 text-sm">Looking for the old site? Check out the previous version:</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="glass border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-full hover-lift-stable"
              >
                <Link href="https://legacy.lucazani.com" target="_blank" rel="noopener noreferrer">
                  <Globe className="mr-2 h-4 w-4" />
                  Visit Legacy Site
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="glass border-gray-600/30 text-gray-400 hover:bg-white/10 rounded-full hover-lift-stable"
              >
                <Link href="https://github.com/OverloadedTech/legacywebsite" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  Legacy Source
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
