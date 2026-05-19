'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft, FileQuestion, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-lg w-full"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 sm:mb-8"
        >
          <FileQuestion className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400" />
        </motion.div>

        {/* 404 */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-7xl sm:text-9xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2"
        >
          404
        </motion.h1>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl font-bold text-white mb-3"
        >
          Page Not Found
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 text-sm sm:text-base mb-8 leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved.
          Check the URL or head back to safety.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/5 gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>

          <Link href="/dashboard">
            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2">
              <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
            </Button>
          </Link>

          <Link href="/">
            <Button variant="ghost" className="w-full sm:w-auto text-gray-400 hover:text-white gap-2">
              <Home className="w-4 h-4" /> Home
            </Button>
          </Link>
        </motion.div>

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-xs text-gray-600"
        >
          Billora · Invoice & Project Management
        </motion.p>
      </motion.div>
    </div>
  )
}
