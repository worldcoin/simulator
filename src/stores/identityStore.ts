import type {Identity} from '@/types/identity'
import {create} from 'zustand'

export type IdentityStore = {
  identity: Identity | null
  setIdentity: (identity: Identity | null) => void
}

export const useIdentityStore = create<IdentityStore>((set) => ({
  identity: null,
  setIdentity: (identity) => set(() => ({identity})),
}))
