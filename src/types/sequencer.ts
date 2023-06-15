import type {Chain, CredentialType} from './common'

export interface SequencerRequest {
  chain: Chain
  endpoint: string
  credentialType: CredentialType
  commitment: string
  authenticate?: boolean
}

export interface InclusionProofResponse {
  status: string
  root: string | null
  proof: Record<'Left' | 'Right', string>[] | null
  message: string
}
