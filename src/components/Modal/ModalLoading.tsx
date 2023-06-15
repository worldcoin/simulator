import {Icon} from '@/components/Icon'

export default function ModalLoading() {
  return (
    <div className="flex h-[360px] items-center justify-center">
      <Icon name="spinner" className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  )
}
