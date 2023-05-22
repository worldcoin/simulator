import React from "react";
import { Modal } from "./Modal";

export function SignIn() {
  const [open, setOpen] = React.useState(true);

  return (
    <div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="GitLab Fox"
        //status="error"
      />
    </div>
  );
}
