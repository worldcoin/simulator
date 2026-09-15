import { AssetIcon, Icon } from "@/components/Icon";
import { WORLD_ID_ART, WORLD_ID_ICONS } from "@/lib/assets";
import type { CredentialDefinition, CredentialKind } from "@/lib/credentials";
import { cn } from "@/lib/utils";
import Image from "next/image";

/**
 * Surfaces lifted from World App's credential card shaders. The app renders
 * these with Metal foil shaders that react to device tilt; a static sheen
 * stands in here, while the gem, wordmark texture and emblems are the real
 * assets.
 */
const surfaces: Record<
  CredentialKind,
  {
    card: string;
    sheen: string;
    title: string;
    subtitle: string;
    footer: string;
  }
> = {
  // HumanVerifiedBackgroundShader: warm grey (217,214,213) to near-white (245,243,240)
  human: {
    card: "bg-[linear-gradient(180deg,#D9D6D5_0%,#F5F3F0_100%)] ring-1 ring-inset ring-black/20",
    sheen:
      "bg-[linear-gradient(115deg,rgba(255,255,255,0)_25%,rgba(255,255,255,0.7)_50%,rgba(255,255,255,0)_75%)] opacity-70",
    title: "",
    subtitle: "text-[#8C8C8C]",
    footer: "text-[#8C8C8C]",
  },
  // PassportBackgroundShader on PassportColor.blue with gold foil text
  passport: {
    card: "bg-[#0C1A32] ring-[1.5px] ring-inset ring-white/5",
    sheen:
      "bg-[linear-gradient(120deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_35%,rgba(255,255,255,0.06)_65%,rgba(255,255,255,0)_100%)]",
    title: "text-[#FFEDB3]",
    subtitle: "text-[#FFEDB3]/70",
    footer: "text-white/70",
  },
  // NationalIDBackgroundShader: pastel holographic gradient at 60% over white
  id: {
    card: "bg-[radial-gradient(farthest-corner_at_105%_105%,#F6F6F7_0%,#CEECFF_23%,#FAD7E2_47%,#F5F5F6_68%,#DAEEFD_88%,#D8ECF8_100%)] ring-1 ring-inset ring-[#3D4D9A]/10",
    sheen:
      "bg-[linear-gradient(115deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0)_70%)] opacity-80",
    title: "text-[#3D4D9A]",
    subtitle: "text-[#3D4D9A]/70",
    footer: "text-[#3D4D9A]",
  },
  // FaceVerifiedCard: #F9FAFB to #F5F8FF with #002466 text
  device: {
    card: "bg-[linear-gradient(180deg,#F9FAFB_0%,#F5F8FF_100%)] ring-1 ring-inset ring-black/[0.08]",
    sheen: "",
    title: "text-[#002466]",
    subtitle: "text-[#3C4C99]",
    footer: "text-[#3C4C99]",
  },
};

function Emblem({ credential }: { credential: CredentialDefinition }) {
  switch (credential.kind) {
    case "human":
      return (
        <span className="relative size-9 shrink-0">
          <Image
            src={WORLD_ID_ART.holographicGem}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
          />
          <AssetIcon
            src={WORLD_ID_ICONS.humanVerifiedGlyph}
            noMask
            bgClassName="absolute inset-0"
            className="size-[22px]"
          />
        </span>
      );
    case "passport":
      return (
        <AssetIcon
          src={WORLD_ID_ICONS.passportEmblem}
          noMask
          className="size-10"
        />
      );
    case "id":
      return (
        <Icon
          name="card-credential"
          className="size-9 text-[#3D4D9A]"
        />
      );
    case "device":
      return (
        <Icon
          name="smartphone"
          className="size-9 text-[#002466]"
        />
      );
  }
}

/** A World ID credential card: 100:63 aspect ratio, 14pt corners, soft shadow. */
export function CredentialCard(props: {
  credential: CredentialDefinition;
  className?: string;
}) {
  const surface = surfaces[props.credential.kind];
  const isHuman = props.credential.kind === "human";

  return (
    <div
      className={cn(
        "relative aspect-[100/63] w-full overflow-hidden rounded-14 shadow-card no-select",
        surface.card,
        props.className,
      )}
    >
      {surface.sheen && (
        <div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0", surface.sheen)}
        />
      )}

      <div className="absolute inset-x-6 top-5 flex items-start justify-between">
        <span
          className={cn(
            "text-[22px] font-semibold leading-none tracking-[-0.01em]",
            // The "Human" wordmark is filled with the app's gold foil texture.
            { "bg-cover bg-clip-text bg-center text-transparent": isHuman },
            surface.title,
          )}
          style={
            isHuman
              ? {
                  // The texture alone is too pale on the silver card without
                  // the app's foil shader, so multiply it with a gold base.
                  backgroundImage: `url(${WORLD_ID_ART.humanTextTexture.src}), linear-gradient(90deg, #A8782C 0%, #D3AE5C 50%, #A8782C 100%)`,
                  backgroundSize: "100% 100%",
                  backgroundBlendMode: "multiply",
                }
              : undefined
          }
        >
          {props.credential.title}
        </span>
        <Emblem credential={props.credential} />
      </div>

      <div className="absolute inset-x-6 bottom-5 flex items-end justify-between">
        <span
          className={cn(
            "text-[13px] font-light uppercase leading-none tracking-[0.06em]",
            surface.subtitle,
          )}
        >
          {props.credential.subtitle}
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 text-[16px] font-light leading-none",
            surface.footer,
          )}
        >
          <Icon
            name="worldcoin"
            className="size-4"
          />
          World ID
        </span>
      </div>
    </div>
  );
}
