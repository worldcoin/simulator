import {METADATA} from '@/lib/constants'
import {Core} from '@walletconnect/core'
import type {ICore, PairingTypes} from '@walletconnect/types'
import type {IWeb3Wallet} from '@walletconnect/web3wallet'
import {Web3Wallet} from '@walletconnect/web3wallet'

const WALLETCONNECT_PID = process.env.NEXT_PUBLIC_WALLETCONNECT_PID

export let core: ICore
export let client: IWeb3Wallet

function getTopic(uri: string): string | null {
  const topicRegex = /wc:([a-f0-9]+)@2/
  const match = uri.match(topicRegex)
  return match ? match[1] : null
}

export async function setupClient(): Promise<boolean> {
  core = new Core({
    // logger: "debug",
    projectId: WALLETCONNECT_PID,
  })

  client = await Web3Wallet.init({
    core,
    metadata: METADATA,
  })

  return true
}

export async function pairClient(uri: string): Promise<PairingTypes.Struct | void> {
  const pairings = core.pairing.getPairings()
  const topics = pairings.map((pairing) => pairing.topic)
  const topic = getTopic(uri)

  if (topic && !topics.includes(topic)) {
    return await core.pairing.pair({uri})
  } else if (topic && topics.includes(topic)) {
    return await core.pairing.activate({topic})
  } else {
    console.error('Invalid or expired WalletConnect URI, please try again.')
  }
}
