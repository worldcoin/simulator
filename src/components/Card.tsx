import type {IconType} from '@/components/Icon'
import {Icon} from '@/components/Icon'
import clsx from 'clsx'
import type {ReactNode} from 'react'
import React from 'react'

export const Card = React.memo(function Card(props: {
  icon: IconType
  heading: string
  text: ReactNode | string
  className?: string
  iconClassName?: string
  iconBgClassName?: string
  children?: ReactNode
}) {
  return (
    <div className={clsx('rounded-16 bg-gray-50 p-5', props.className)}>
      <Icon
        name={props.icon}
        className={clsx('h-6 w-6 text-white', props.iconClassName)}
        bgClassName={clsx('bg-black h-10 w-10 rounded-12', props.iconBgClassName)}
      />
      <h2 className="mt-3 font-rubik text-18 font-semibold text-gray-900 xs:mt-5">{props.heading}</h2>
      <div className="mt-1 font-rubik text-14 text-gray-500">{props.text}</div>
      {props.children}
    </div>
  )
})
