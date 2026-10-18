/**
 * What the page shows when something throws while it is drawn -- formancy's
 * engine, or a package by a bug -- instead of going blank: the fallback,
 * which says nothing more is made. The error itself is not shown or
 * logged: what it says is not the page's to know, and it may quote what
 * was typed.
 */
import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  readonly fallback: ReactNode
  readonly children: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, { readonly failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError(): { readonly failed: boolean } {
    return { failed: true }
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
