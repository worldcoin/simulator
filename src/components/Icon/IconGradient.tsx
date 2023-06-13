import type {IconType} from '@/components/Icon'
import {Icon} from '@/components/Icon'
import clsx from 'clsx'
import React from 'react'

export const IconGradient = React.memo(function IconGradient(props: {
  name: IconType
  color: string
  className?: string
  bgClassName?: string
}) {
  return (
    <div
      className={clsx(
        'relative flex items-center justify-center',
        {'h-8 w-8 text-white': !props.bgClassName},
        props.bgClassName,
      )}
      style={
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- FIXME
        {
          '--color': props.color,
        } as React.CSSProperties
      }
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="13.2" style={{fill: 'var(--color)'}} />

        <rect opacity="0.5" width="44" height="44" rx="13.2" fill="url(#paint0_radial_401_10740)" />

        <defs>
          <radialGradient
            id="paint0_radial_401_10740"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1.60265 -8.73246) rotate(55.0103) scale(64.3663 64.0887)"
          >
            <stop stopColor="white" />

            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      <Icon name={props.name} className={clsx({'h-5 w-5 text-white': !props.className}, props.className)} />
    </div>
  )
})
