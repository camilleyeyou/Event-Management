import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 gradient-hero relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-float absolute top-[20%] left-[25%] w-20 h-20 rounded-full bg-green-300/30 blur-xl" />
        <div className="animate-float-slow absolute bottom-[30%] right-[20%] w-24 h-24 rounded-full bg-purple-300/25 blur-2xl" />
        <div className="animate-float-delayed absolute top-[60%] left-[60%] w-16 h-16 rounded-full bg-yellow-300/30 blur-xl" />
      </div>

      <div className="relative z-10 text-center space-y-5 max-w-md animate-fade-up">
        <div className="text-8xl font-extrabold bg-linear-to-r from-(--color-primary) via-(--color-accent) to-(--color-rose) bg-clip-text text-transparent">
          404
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
        <p className="text-gray-500 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link to="/">
            <Button>Go home</Button>
          </Link>
          <Link to="/events">
            <Button variant="outline" className="bg-white/80 backdrop-blur-sm">Browse events</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
