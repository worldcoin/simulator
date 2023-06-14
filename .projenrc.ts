import {OttofellerNextjsProject, VsCodeSettings} from '@ottofeller/templates'
import {job, npmRunJobStep} from '@ottofeller/templates/lib/common/github'
import {NodePackageManager} from 'projen/lib/javascript'

const project = new OttofellerNextjsProject({
  defaultReleaseBranch: 'main',
  name: 'simulator',
  packageName: 'simulator',
  projenrcTs: true,
  dependabot: false,
  hasDocker: false,
  isGraphqlEnabled: false,
  packageManager: NodePackageManager.PNPM,
  sampleCode: false,
  tailwind: true,
  license: 'MIT',
  copyrightOwner: 'Tools for Humanity Corporation',
  copyrightPeriod: '2022',

  deps: [
    '@radix-ui/react-checkbox@^1.0.3',
    '@radix-ui/react-dialog@^1.0.3',
    '@radix-ui/react-dropdown-menu@^2.0.4',
    '@radix-ui/react-radio-group@^1.1.2',
    '@semaphore-protocol/group@^3.9.0',
    '@semaphore-protocol/identity@^3.9.0',
    '@semaphore-protocol/proof@^3.9.0',
    '@walletconnect/core@^2.7.7',
    '@walletconnect/utils@^2.7.0',
    '@walletconnect/web3wallet@^1.7.5',
    '@worldcoin/idkit@^0.4.9',
    '@zk-kit/incremental-merkle-tree@^1.0.0',
    '@zk-kit/protocols@^1.11.1',
    'clsx@^1.2.1',
    'connectkit@^1.4.0',
    'dayjs@^1.11.7',
    'jsqr@^1.4.0',
    'react-toastify@^9.1.2',
    'snarkjs@0.4.20',
    'usehooks-ts@^2.9.1',
    'viem@^0.3.37',
    'wagmi@^1.0.8',
    'zustand@^4.3.7',
  ],

  devDeps: [
    '@ottofeller/templates',
    '@next/bundle-analyzer@^13.4.4',
    '@walletconnect/types@^2.7.7',
    'cspell@^6.8.0',
    'eslint-config-next@13.3.0',
    'eslint-config-prettier@^8.5.0',
    'eslint-plugin-jsx-a11y@^6.5.1',
    'husky@^8.0.3',
    'prettier-plugin-organize-attributes@^0.0.5',
    'prettier-plugin-tailwindcss@0.1.10',
    'workbox-cli@^6.5.4',
    'workbox-expiration@^7.0.0',
    'workbox-precaching@^7.0.0',
    'workbox-routing@^7.0.0',
    'workbox-strategies@^7.0.0',
  ],
})

// ANCHOR: node project settings
project.package.addVersion('2.0.0')
project.package.addField('private', true)

project.package.addField('lint-staged', {
  'src/**/*.{js,jsx,ts,tsx}': 'eslint --cache --fix',
  'src/**/*.{js,jsx,ts,tsx,css,md}': 'prettier --write --ignore-unknown',
})

// ANCHOR: tsconfig
const tsconfig = {
  paths: {
    '@/*': ['./src/*'],
    '@/public/*': ['./public/*'],
  },
}

project.tsconfig?.file.addOverride('compilerOptions', tsconfig)
project.tsconfigDev.file.addOverride('compilerOptions', tsconfig)

// ANCHOR: add npm scripts
project.package.setScript('build', 'rm -rf public/workbox-* && next build && workbox injectManifest workbox-config.cjs')
project.package.setScript('spellcheck', 'cspell **/*.{js,ts,tsx,md,mdx,json}')
project.package.setScript('start', 'next start')
project.package.setScript('prepare', 'husky install')
project.package.setScript('test', 'jest --no-cache --all --passWithNoTests')

project.package.setScript(
  'prebuild',
  "node -e \"const fs = require('fs'); const pkg = require('./package.json'); fs.writeFileSync('./public/version.json', JSON.stringify({ version: pkg.version }));\"",
)

// ANCHOR: github workflows
project.github?.tryFindWorkflow('test')?.addJobs({
  spellcheck: job([npmRunJobStep('spellcheck')]),
})

// ANCHOR: vscode
VsCodeSettings.of(project)?.add({
  'editor.codeActionsOnSave': {
    'source.fixAll': true,
    'source.organizeImports': true,
  },
  'editor.formatOnSave': true,
  '[typescriptreact]': {
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
  },
  '[typescript]': {
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
  },
  '[html]': {
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
  },
  '[css]': {
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
  },
  '[xml]': {
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
  },
  'prettier.documentSelectors': ['**/*.svg'],
  'eslint.options': {
    cache: true,
    reportUnusedDisableDirectives: 'error',
  },
  'css.validate': false,
  'testExplorer.useNativeTesting': true,
})

const vscodeExtensions = project.tryFindObjectFile('./.vscode/extensions.json')

vscodeExtensions?.addOverride('recommendations', [
  'exodiusstudios.comment-anchors',
  'mikestead.dotenv',
  'dbaeumer.vscode-eslint',
  'mohsen1.prettify-json',
  'github.copilot',
  'graphql.vscode-graphql',
  'bradlc.vscode-tailwindcss',
  'esbenp.prettier-vscode',
  'github.vscode-pull-request-github',
  'streetsidesoftware.code-spell-checker',
  'orta.vscode-jest',
  'amazonwebservices.aws-toolkit-vscode',
  'ms-azuretools.vscode-docker',
  'Quidgest.vscode-velocity',
  'webben.browserslist',
  'stylelint.vscode-stylelint',
])

vscodeExtensions?.addOverride('unwantedRecommendations', [
  'DavidAnson.vscode-markdownlint',
  'GoogleCloudTools.cloudcode',
  'ms-kubernetes-tools.vscode-kubernetes-tools',
])

// ANCHOR: gitignore
project.gitignore.addPatterns('public/sw.js*', 'public/workbox*.js*', '*.pem')

project.synth()
