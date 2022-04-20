import type { Identity } from "@/types";
import { Strategy, ZkIdentity } from "@zk-kit/identity";

type RawIdentity = {
  ZkIdentity: ZkIdentity;
  id: string;
};

type StoredIdentity = {
  ZkIdentity: string;
  id: string;
};

export function useIdentityStorage() {
  const IDENTITY_STORAGE_KEY = "Identity";

  const getIdentity = () => {
    try {
      const storedIdentity = sessionStorage.getItem(IDENTITY_STORAGE_KEY);
      if (!storedIdentity) {
        return null;
      }

      const parsedIdentity = JSON.parse(storedIdentity) as StoredIdentity;

      const parsedZkIdentity = new ZkIdentity(
        Strategy.SERIALIZED,
        parsedIdentity.ZkIdentity,
      );

      const commitment = parsedZkIdentity.genIdentityCommitment();
      const trapdoor = parsedZkIdentity.getTrapdoor();
      const nullifier = parsedZkIdentity.getNullifier();

      const identity: Omit<Identity, "verified"> = {
        commitment,
        trapdoor,
        nullifier,
        id: parsedIdentity.id,
      };

      console.log("Restored serialized identity");

      return identity;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const storeIdentity = ({ ZkIdentity, id }: RawIdentity) => {
    const identity = {
      ZkIdentity: ZkIdentity.serializeIdentity(),
      id,
    };

    try {
      sessionStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    } catch {
      console.error("Unable to persist disposable identity");
    }
  };

  const clearIdentity = () => {
    try {
      sessionStorage.removeItem(IDENTITY_STORAGE_KEY);
    } catch {}
  };

  return {
    getIdentity,
    storeIdentity,
    clearIdentity,
  };
}
