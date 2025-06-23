"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Scale, Check, X, Home } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LicensePage() {
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
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-float"></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "3s" }}
      ></div>

      {/* Header */}
      <div className="container mx-auto max-w-4xl py-12 px-4 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={handleBackToHome}
            variant="outline"
            size="sm"
            className="glass border-gray-500/30 text-gray-200 hover:bg-white/10 rounded-full hover-lift-stable"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-glow">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-4">MIT License Statement</h1>
          <p className="text-xl text-gray-300">This website is licensed under the MIT License</p>
        </div>

        {/* License Details */}
        <div className="space-y-8">
          <div className="card-enhanced rounded-2xl p-8 hover-lift-stable">
            <h3 className="text-green-400 text-xl font-bold flex items-center gap-2 mb-6">
              <Check className="h-5 w-5" />
              You are free to:
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                Use the code for personal or commercial purposes
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                Modify the code
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                Distribute the code
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                Sublicense the code
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                Use the code for private or public projects
              </li>
            </ul>
          </div>

          <div className="card-enhanced rounded-2xl p-8 hover-lift-stable">
            <h3 className="text-yellow-400 text-xl font-bold mb-6">Under the condition that you:</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-yellow-500 rounded mt-0.5 flex-shrink-0"></div>
                Include a copy of the license in the project
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-yellow-500 rounded mt-0.5 flex-shrink-0"></div>
                Include the copyright notice in the project
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-yellow-500 rounded mt-0.5 flex-shrink-0"></div>
                Provide the code as is, without warranty or liability
              </li>
            </ul>
          </div>

          <div className="card-enhanced rounded-2xl p-8 hover-lift-stable">
            <h3 className="text-red-400 text-xl font-bold flex items-center gap-2 mb-6">
              <X className="h-5 w-5" />
              You are not allowed to:
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                Use the name or logo of the author without permission
              </li>
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                Hold the author liable for any damages arising from the use of the code
              </li>
            </ul>
          </div>

          {/* Full License Text */}
          <div className="card-enhanced rounded-2xl p-8 hover-lift-stable">
            <h3 className="text-gradient text-xl font-bold mb-6">Full MIT License Text</h3>
            <div className="bg-gray-900/50 p-6 rounded-lg font-mono text-sm text-gray-300 leading-relaxed">
              <p className="mb-4">MIT License</p>
              <p className="mb-4">Copyright (c) {new Date().getFullYear()} Luca Zani</p>
              <p className="mb-4">
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
                associated documentation files (the "Software"), to deal in the Software without restriction, including
                without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
                following conditions:
              </p>
              <p className="mb-4">
                The above copyright notice and this permission notice shall be included in all copies or substantial
                portions of the Software.
              </p>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
                LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
                NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
                WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
                SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <Button
            onClick={handleBackToHome}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold px-8 py-4 rounded-full btn-glow hover-lift-stable"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
