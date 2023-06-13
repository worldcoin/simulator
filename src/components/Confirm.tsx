import {Icon} from './Icon'

export default function Confirm(props: {isConfirmed: boolean}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Icon
        name="shield"
        className="h-10 w-10 text-icons-blue-primary"
        bgClassName="w-20 h-20 rounded-full bg-icons-blue-secondary"
      />
      <h1 className="mt-8 font-sora text-30 font-semibold text-gray-900">Confirm signature request</h1>
      <p className="mt-4 font-rubik text-18 text-gray-500">
        Please confirm the signature request in your wallet to generate your World ID identity.
      </p>
      <div className="absolute bottom-12 flex items-center">
        {!props.isConfirmed && (
          <>
            <Icon name="spinner" className="h-6 w-6 animate-spin text-black" />
            <span className="ml-2 text-16 font-semibold text-gray-500">Confirmation pending</span>
          </>
        )}
        {props.isConfirmed && (
          <>
            <Icon name="checkmark" className="h-4 w-4 text-white " bgClassName="rounded-full w-6 h-6 bg-success-700" />
            <span className="ml-2 text-16 font-semibold text-success-700">Confirmed</span>
          </>
        )}
      </div>
    </div>
  )
}
