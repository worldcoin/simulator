import { CredentialType, type Identity } from "@/types";
import { useMemo } from "react";

interface WarningProps {
  identity: Identity | null;
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
    return false;
  }, [props.biometricsChecked, props.identity?.verified, props.phoneChecked]);

  const noCredentials = useMemo(() => {
    if (!props.biometricsChecked && !props.phoneChecked) {
      return true;
    }
    return false;
  }, [props.biometricsChecked, props.phoneChecked]);

  return (
    <>
      {visible && (
        <p className="mx-2 mt-2 text-b4 text-error-700">
          This action will fail as{" "}
          {noCredentials ? "no credentials" : "the selected credentials do not"}{" "}
          exist. Proceed to test an error case.
        </p>
      )}
    </>
  );
}
