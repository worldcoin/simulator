import { type Identity } from "@/types";
import { CredentialType } from "@worldcoin/idkit";
import { useMemo } from "react";

interface WarningProps {
  identity: Identity | null;
  onChain: boolean;
  biometricsChecked: boolean | "indeterminate";
  phoneChecked: boolean | "indeterminate";
}

export default function Warning(props: WarningProps) {
  const invalidCredential = useMemo(() => {
    // Orb is selected but not verified
    if (
      props.biometricsChecked &&
      !props.identity?.verified[CredentialType.Orb]
    ) {
      return true;
    }

    // Phone is selected but not verified
    if (props.phoneChecked && !props.identity?.verified[CredentialType.Phone]) {
      return true;
    }

    return false;
  }, [props.biometricsChecked, props.identity?.verified, props.phoneChecked]);

  const noCredentials = useMemo(() => {
    // No credentials are selected
    if (!props.biometricsChecked && !props.phoneChecked) {
      return true;
    }
    return false;
  }, [props.biometricsChecked, props.phoneChecked]);

  const onlyPhoneOnChain = useMemo(() => {
    // only Phone is selected for on-chain app
    if (!props.biometricsChecked && props.phoneChecked && props.onChain) {
      return true;
    }
    return false;
  }, [props.biometricsChecked, props.phoneChecked, props.onChain]);

  const visible = useMemo(() => {
    // visible if any warning states are true
    if (noCredentials || invalidCredential || onlyPhoneOnChain) {
      return true;
    }
    return false;
  }, [noCredentials, invalidCredential, onlyPhoneOnChain]);

  return (
    <>
      {visible && (
        <p className="mx-2 mt-2 text-b4 text-error-700">
          {noCredentials &&
            "This action will fail as no credentials are selected. "}
          {invalidCredential &&
            "This action will fail as the selected credential(s) do not exist. "}
          {onlyPhoneOnChain &&
            "This action will fail as phone credentials are not supported on-chain. "}
          Proceed to test an error case.
        </p>
      )}
    </>
  );
}
