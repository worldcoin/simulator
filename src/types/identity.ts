import type {Identity as ZkIdentity} from '@semaphore-protocol/identity'
import type {Chain, CredentialType} from './common'
import type {InclusionProofResponse} from './sequencer'

export interface Identity {
  readonly id: string
  readonly zkIdentity: ZkIdentity
  chain: Chain // TODO: refactor
  persisted: boolean
  verified: Record<CredentialType, boolean>
  inclusionProof: Record<CredentialType, InclusionProofResponse | null>
}

export interface StoredIdentity {
  readonly id: string
  readonly zkIdentity: string
  chain: Chain // TODO: refactor
  persisted: boolean
  verified: Record<CredentialType, boolean>
  inclusionProof: Record<CredentialType, InclusionProofResponse | null>
}
