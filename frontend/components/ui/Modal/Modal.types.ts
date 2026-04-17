import type { ReactNode } from 'react'

export type ModalProps = {
  isOpen: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}
