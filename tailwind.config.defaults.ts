import plugin from 'tailwindcss/plugin'
import {Config} from 'tailwindcss/types/config'

const defaultConfig: Config = {
  content: ['./src/**/*.tsx'],

  plugins: [
    require('@tailwindcss/container-queries'),
    plugin(({addUtilities}) => addUtilities({'.span-full': {gridArea: '1/1/-1/-1'}})),
  ],
}

export default defaultConfig
