"use client"

import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search, Coffee, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const [countdown, setCountdown] = useState(10)
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

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/")
          setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
          }, 50)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleBackToHome = () => {
    router.push("/")
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 50)
  }

  const funnyMessages = [
    "This page took a coffee break and never came back.",
    "404: Page not found. It's probably debugging itself somewhere.",
    "The page you're looking for went on a digital adventure.",
    "This URL leads to nowhere, but at least you found my 404 page!",
    "Page missing in action. Last seen: never.",
    "Looks like this page got lost in the matrix.",
    "Error 404: Page not found. Have you tried turning it off and on again?",
  ]

  const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)]

  return (
    <div className="main-bg relative overflow-hidden min-h-screen flex items-center justify-center px-4">
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
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-float"></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "3s" }}
      ></div>

      <div className="text-center max-w-2xl mx-auto relative z-10">
        {/* 404 Display */}
        <div className="mb-8">
          <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent mb-4 animate-pulse">
            404
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-6">
            <Search className="h-5 w-5" />
            <span className="font-mono">Page Not Found</span>
          </div>
        </div>

        {/* Error Card */}
        <div className="card-enhanced rounded-3xl p-8 mb-8 hover-lift-stable">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coffee className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-white">Oops! Page Not Found</h1>
          </div>

          <p className="text-gray-300 mb-4 leading-relaxed text-lg">{randomMessage}</p>

          <p className="text-gray-400 mb-6 text-sm">
            The page you're looking for might have been moved, deleted, or is taking an extended vacation.
          </p>

          {/* Countdown */}
          <div className="glass border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Taking you home in {countdown} seconds</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            onClick={handleBackToHome}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold px-8 py-4 rounded-full btn-glow hover-lift-stable"
          >
            <Home className="mr-2 h-5 w-5" />
            Take Me Home
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 px-8 py-4 rounded-full hover-lift-stable"
          >
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Check Out Projects
            </Link>
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="lg"
            className="glass border-blue-500/30 text-blue-200 hover:bg-blue-500/10 px-8 py-4 rounded-full hover-lift-stable"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
        </div>

        {/* Contact Info */}
        <div className="text-sm text-gray-500">
          <p>
            Think this page should exist? Drop me a line at{" "}
            <Link href="mailto:luca@lucazani.com" className="text-green-400 hover:underline">
              luca@lucazani.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
