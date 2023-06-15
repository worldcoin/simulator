import clsx from 'clsx'
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  renderButton?: (props: {isEmpty: boolean; isFocused: boolean; isInvalid: boolean}) => React.ReactNode
}

export const Input = React.memo(function Input(props: InputProps) {
  const {className, value, onChange, invalid: isInvalid = false, renderButton, ...otherProps} = props

  const [isEmpty, setIsEmpty] = React.useState<boolean>(true)

  // This useEffect is required to set the correct state of the input field when the value is changed from outside
  React.useEffect(() => {
    if (value === undefined || value === '') {
      setIsEmpty(true)
    }
  }, [value])

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsEmpty(e.target.value === '')

      if (onChange) {
        onChange(e)
      }
    },
    [onChange],
  )

  const [isFocused, setIsFocused] = React.useState<boolean>(false)

  const handleFocus = React.useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = React.useCallback(() => {
    setIsFocused(false)
  }, [])

  return (
    <div
      className={clsx(className, 'flex items-center rounded-12 border-2 p-0.5', {
        'bg-gray-100': !isFocused,
        'border-gray-100': !isFocused && !isInvalid,
        'border-error-700': isInvalid,
        'bg-white shadow-input': isFocused,
        'border-gray-200': isFocused && !isInvalid,
      })}
    >
      <input
        className="h-10 grow bg-transparent px-3 text-14 outline-0 placeholder:text-gray-500"
        placeholder="QR code"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...otherProps}
      />

      {renderButton?.({isEmpty, isFocused, isInvalid})}
    </div>
  )
})
