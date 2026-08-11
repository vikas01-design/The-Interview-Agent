import { useEffect } from 'react'

/**
 * Custom hook to initialize IntersectionObserver for scroll-triggered animations.
 * Observes elements with `.reveal-on-scroll`, `.reveal-snap-scale`, `.clip-container`, `.clip-block`, `.slide-up-heading`
 * and applies `.in-view` class with crisp, 0% blur industrial stepped transitions.
 */
export function useScrollReveal(dependencies: any[] = []) {
  useEffect(() => {
    const selector = '.reveal-on-scroll, .reveal-snap-scale, .clip-container, .clip-block, .slide-up-heading-scroll'

    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          // Once revealed, keep it revealed for smooth UX or unobserve
          observer.unobserve(entry.target)
        }
      })
    }

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1,
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)
    const elements = document.querySelectorAll(selector)

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, dependencies)
}
