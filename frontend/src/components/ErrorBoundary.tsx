import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.href = '/'
              }}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-(--color-primary) text-white font-medium hover:opacity-90"
            >
              Go to homepage
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
