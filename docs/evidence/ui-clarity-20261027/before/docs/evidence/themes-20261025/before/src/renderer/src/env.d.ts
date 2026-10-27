import type { DesktopApi } from '../../shared/contracts/application'

declare global {
  interface Window {
    desktop: DesktopApi
  }
}
