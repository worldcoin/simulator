import { CredentialType, type Identity } from "@/types";
import { useMemo } from "react";

interface WarningProps {
  identity: Identity | null;
  onChain: boolean;
  biometricsChecked: boolean | "indeterminate";
  phoneChecked: boolean | "indeterminate";
}

export default function Warning(props: WarningProps) {
  const visible = useMemo(() => {
    // No credentials are selected
    if (!props.biometricsChecked && !props.phoneChecked) {
      return true;
    }

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

    // only Phone selected and on-chain
    if (!props.biometricsChecked && props.phoneChecked && props.onChain) {
      return true;
    }
    return false;
  }, [
    props.biometricsChecked,
    props.identity?.verified,
    props.phoneChecked,
    props.onChain,
  ]);

  const noCredentials = useMemo(() => {
    if (!props.biometricsChecked && !props.phoneChecked) {
      return true;
    }
    return false;
  }, [props.biometricsChecked, props.phoneChecked]);

  const onlyPhoneOnChain = useMemo(() => {
    if (!props.biometricsChecked && props.phoneChecked && props.onChain) {
      return true;
    }
    return false;
  }, [props.biometricsChecked, props.phoneChecked, props.onChain]);

  return (
    <>
      {visible && (
        <p className="mx-2 mt-2 text-b4 text-error-700">
          {noCredentials
            ? "This action will fail as no credentials are selected. Proceed to test an error case."
            : "This action will fail as the selected credentials do not exist. Proceed to test an error case."}
          {onlyPhoneOnChain &&
            "Phone verification is not supported on-chain. Proceed to test an error case."}
        </p>
      )}
    </>
  );
}
