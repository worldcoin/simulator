import { Icon } from "@/common/Icon";
import logoSvg from "@/static/logo.svg";
import cn from "classnames";
import React from "react";

export const Verified = React.memo(function Verified() {
  return (
    <React.Fragment>
      {/* shadows */}
      <span
        className={cn(
          "absolute inset-0 bg-000000/[.04] opacity-80 mix-blend-overlay",
          "shadow-[inset_1px_1px_1px_#ffffff,_inset_0_0_-1px_rgba(0,_0,_0,_0.4)]",
        )}
      />

      {/* flare */}
      <span
        className={cn(
          "absolute top-0 left-0 h-[200%] w-[70px] opacity-30 blur-2xl",
          "translate-x-[calc(var(--cardTilt)_*_10)] rotate-[-35deg]",
          "bg-[linear-gradient(-35deg,_transparent_,#ffffff,_transparent)]",
        )}
      />

      {/* shine */}
      <span
        className={cn(
          "absolute inset-0 opacity-20 mix-blend-soft-light",
          "bg-[linear-gradient(45deg,_transparent_0%,_#ffffff_37%,_transparent_72%,_#eeeeee_80%,_transparent_100%)]",
          "bg-[position:var(--cardTilt)_0]",
        )}
      />

      {/* scratches */}
      <span
        className={cn(
          "absolute inset-0 opacity-60 mix-blend-multiply",
          "bg-[url('./static/card-scratches.jpg')] bg-cover bg-center",
        )}
      />

      {/* frame */}
      <svg
        width="0"
        height="0"
      >
        <defs>
          <clipPath id="cardFrame">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M167.058 2.3762H206.447C213.691 2.3762 218.894 2.38105 222.854 2.9134C226.748 3.43692 229.095 4.43259 230.83 6.16769C232.565 7.90279 233.561 10.2503 234.084 14.1442C234.617 18.1037 234.622 23.3067 234.622 30.5505V307.725C234.622 314.969 234.617 320.172 234.084 324.131C233.561 328.025 232.565 330.373 230.83 332.108C229.095 333.843 226.748 334.838 222.854 335.362C218.894 335.894 213.691 335.899 206.447 335.899H30.5483C23.3046 335.899 18.1015 335.894 14.142 335.362C10.2481 334.838 7.90059 333.843 6.16549 332.108C4.43039 330.373 3.43472 328.025 2.9112 324.131C2.37885 320.172 2.374 314.969 2.374 307.725V30.5505C2.374 23.3067 2.37885 18.1037 2.9112 14.1442C3.43472 10.2503 4.43039 7.90279 6.16549 6.16769C7.90059 4.43259 10.2481 3.43692 14.142 2.9134C18.1015 2.38105 23.3045 2.3762 30.5483 2.3762H71.4601L77.151 12.258C80.4129 17.9221 86.4515 21.4129 92.9877 21.4129H145.531C152.067 21.4129 158.106 17.9221 161.367 12.258L167.058 2.3762ZM168.374 0.0917969H206.447C220.806 0.0917969 227.985 0.0917969 232.446 4.55237C236.906 9.01295 236.906 16.1921 236.906 30.5505V307.725C236.906 322.083 236.906 329.262 232.446 333.723C227.985 338.184 220.806 338.184 206.447 338.184H30.5483C16.1899 338.184 9.01075 338.184 4.55017 333.723C0.0895996 329.262 0.0895996 322.083 0.0895996 307.725V30.5505C0.0895996 16.1921 0.0895996 9.01295 4.55017 4.55237C9.01075 0.0917969 16.1899 0.0917969 30.5483 0.0917969H70.1445H168.374Z"
            />
          </clipPath>
        </defs>
      </svg>
      <span
        className={cn(
          "absolute inset-1.5",
          "bg-[url('./static/card-iridescent.jpg')] bg-[length:700px]",
          "bg-[position:var(--cardTilt)_0%] [clip-path:_url('#cardFrame')]",
        )}
      />

      {/* label */}
      <span className="absolute top-2.5 left-1/2 -translate-x-1/2 font-sora text-10 font-semibold">
        #ALC2031
      </span>

      {/* content */}
      <div className=" absolute inset-5 grid content-end justify-items-center gap-y-2">
        <Icon
          data={logoSvg}
          className="h-8 w-8 text-[#d6dfdf]"
        />
        <h1 className="mt-4.5 px-4 text-center font-sora font-semibold text-[#d6dfdf]">
          Your World ID
        </h1>

        <p className="mt-0.5 text-center text-14 uppercase text-858494">
          proof of personhood
        </p>

        <button
          className={cn(
            // cspell:disable-next-line
            "relative rounded-9 bg-cfdce1/10 px-3 py-2 font-sora text-10 text-d1dbe1",
            "after:absolute after:inset-0 after:rounded-[inherit] after:p-px",
            "after:bg-gradient-to-r after:from-transparent after:to-cee2f5",
            "after:[-webkit-mask:_linear-gradient(#fff_0_0)_content-box,_linear-gradient(#fff_0_0)]",
            "after:[-webkit-mask-composite:_xor]",
          )}
        >
          Issued at an Orb
        </button>
      </div>
    </React.Fragment>
  );
});
