import { Icon, type IconType } from "@/components/Icon";
import { PROOF_ART, type ProofArt } from "@/lib/assets";
import type { CredentialDefinition, SecurityLevel } from "@/lib/credentials";
import { SECURITY_LABEL } from "@/lib/credentials";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";

const SEGMENTS: Record<SecurityLevel, { active: number; color: string }> = {
  low: { active: 1, color: "stroke-red-600" },
  medium: { active: 2, color: "stroke-amber-600" },
  highest: { active: 3, color: "stroke-green-600" },
};

/** World App's SecurityLevelIcon: a ring split into three arcs, lit up by level. */
function SecurityLevelIcon({ level }: { level: SecurityLevel }) {
  const size = 18;
  const lineWidth = 2;
  const radius = (size - lineWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = circumference * 0.03;
  const segment = circumference / 3 - gap;
  const { active, color } = SEGMENTS[level];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      className="shrink-0"
    >
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={lineWidth}
          strokeDasharray={`${segment} ${circumference - segment}`}
          transform={`rotate(${-90 + i * 120} ${size / 2} ${size / 2})`}
          className={i < active ? color : "stroke-grey-200"}
        />
      ))}
    </svg>
  );
}

function Divider() {
  return <hr className="border-0 border-t border-stroke-tertiary" />;
}

function DataRow(props: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-b2">
      <dt className="text-fg-secondary">{props.label}</dt>
      <dd className="flex items-center gap-2 text-fg-primary">
        {props.icon}
        {props.value}
      </dd>
    </div>
  );
}

function Section(props: {
  title: string;
  subtitle: string;
  /** Fallback glyph for rows without World App artwork. */
  icon: IconType;
  items: { title: string; description: string; art?: ProofArt }[];
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-h5 text-fg-primary">{props.title}</h3>
        <p className="text-b2 text-fg-secondary">{props.subtitle}</p>
      </div>
      <ul className="flex flex-col gap-4">
        {props.items.map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-3"
          >
            {item.art ? (
              <Image
                src={PROOF_ART[item.art]}
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-8"
              />
            ) : (
              <Icon
                name={props.icon}
                className="mt-0.5 size-6 text-fg-primary"
              />
            )}
            <div className="flex flex-col gap-0.5">
              <p className="text-s2 text-fg-primary">{item.title}</p>
              <p className="text-b2 text-fg-secondary">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The content revealed beneath a focused card in World App's credential hub. */
export function CredentialDetails(props: {
  credential: CredentialDefinition;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex flex-col gap-8", props.className)}
    >
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-h3 text-fg-primary">{props.credential.title}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-1 text-b2 text-fg-primary">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-accent-blue"
          />
          Valid
        </span>
      </header>

      <Divider />

      <dl className="flex flex-col gap-6">
        <DataRow
          label="Uniqueness level"
          value={SECURITY_LABEL[props.credential.security]}
          icon={<SecurityLevelIcon level={props.credential.security} />}
        />
        <DataRow
          label="Verification method"
          value={props.credential.method}
        />
        <DataRow
          label="Issuer"
          value={props.credential.issuer}
        />
      </dl>

      <Divider />

      <Section
        title="You can optionally share"
        subtitle="Apps can request this information and you have to approve before it's shared."
        icon="check-circle"
        items={props.credential.proofs}
      />

      <Divider />

      <Section
        title="Never shared"
        subtitle="This data never leaves your device"
        icon="lock"
        items={props.credential.privacy}
      />
    </motion.div>
  );
}
