// Icons from Nucleus, the World design system World App renders (MIT).
// Import only what the simulator uses; Next bundles each SVG as a static asset.
import arrowLeft from "@worldcoin/nucleus/icons/arrow-left-regular.svg";
import badgeCheck from "@worldcoin/nucleus/icons/badge-check-solid.svg";
import cardCredential from "@worldcoin/nucleus/icons/card-credential-regular.svg";
import checkCircle from "@worldcoin/nucleus/icons/check-circle-regular.svg";
import checkCircleSolid from "@worldcoin/nucleus/icons/check-circle-solid.svg";
import check from "@worldcoin/nucleus/icons/check-regular.svg";
import chevronLeft from "@worldcoin/nucleus/icons/chevron-left-regular.svg";
import chevronRight from "@worldcoin/nucleus/icons/chevron-right-regular.svg";
import contactBook from "@worldcoin/nucleus/icons/contact-book-regular.svg";
import copy from "@worldcoin/nucleus/icons/copy-regular.svg";
import faceId from "@worldcoin/nucleus/icons/face-id-regular.svg";
import globe from "@worldcoin/nucleus/icons/globe-regular.svg";
import humanEmblem from "@worldcoin/nucleus/icons/human-emblem-regular.svg";
import humanEmblemSolid from "@worldcoin/nucleus/icons/human-emblem-solid.svg";
import infoCircle from "@worldcoin/nucleus/icons/info-circle-regular.svg";
import key from "@worldcoin/nucleus/icons/key-regular.svg";
import lock from "@worldcoin/nucleus/icons/lock-regular.svg";
import orbDiamond from "@worldcoin/nucleus/icons/orb-diamond-regular.svg";
import personCircle from "@worldcoin/nucleus/icons/person-circle-regular.svg";
import photo from "@worldcoin/nucleus/icons/photo-regular.svg";
import plus from "@worldcoin/nucleus/icons/plus-regular.svg";
import qrCode from "@worldcoin/nucleus/icons/qr-code-regular.svg";
import refresh from "@worldcoin/nucleus/icons/refresh-regular.svg";
import scan from "@worldcoin/nucleus/icons/scan-regular.svg";
import settings from "@worldcoin/nucleus/icons/settings-regular.svg";
import shieldCheck from "@worldcoin/nucleus/icons/shield-check-regular.svg";
import shieldHalf from "@worldcoin/nucleus/icons/shield-half-solid.svg";
import smartphone from "@worldcoin/nucleus/icons/smartphone-regular.svg";
import text from "@worldcoin/nucleus/icons/text-solid.svg";
import trash from "@worldcoin/nucleus/icons/trash-solid.svg";
import warningTriangle from "@worldcoin/nucleus/icons/warning-triangle-regular.svg";
import worldcoin from "@worldcoin/nucleus/icons/worldcoin-regular.svg";
import xmarkCircle from "@worldcoin/nucleus/icons/xmark-circle-regular.svg";
import xmarkCircleSolid from "@worldcoin/nucleus/icons/xmark-circle-solid.svg";
import xmark from "@worldcoin/nucleus/icons/xmark-regular.svg";

/** Next's image loader hands SVG imports back as `{ src }` static assets. */
const asset = (module: unknown): string => (module as { src: string }).src;

export const NUCLEUS_ICONS = {
  "arrow-left": asset(arrowLeft),
  "badge-check": asset(badgeCheck),
  "card-credential": asset(cardCredential),
  check: asset(check),
  "check-circle": asset(checkCircle),
  "check-circle-solid": asset(checkCircleSolid),
  "chevron-left": asset(chevronLeft),
  "chevron-right": asset(chevronRight),
  "contact-book": asset(contactBook),
  copy: asset(copy),
  "face-id": asset(faceId),
  globe: asset(globe),
  "human-emblem": asset(humanEmblem),
  "human-emblem-solid": asset(humanEmblemSolid),
  "info-circle": asset(infoCircle),
  key: asset(key),
  lock: asset(lock),
  "orb-diamond": asset(orbDiamond),
  "person-circle": asset(personCircle),
  photo: asset(photo),
  plus: asset(plus),
  "qr-code": asset(qrCode),
  refresh: asset(refresh),
  scan: asset(scan),
  settings: asset(settings),
  "shield-check": asset(shieldCheck),
  "shield-half": asset(shieldHalf),
  smartphone: asset(smartphone),
  text: asset(text),
  trash: asset(trash),
  "warning-triangle": asset(warningTriangle),
  worldcoin: asset(worldcoin),
  xmark: asset(xmark),
  "xmark-circle": asset(xmarkCircle),
  "xmark-circle-solid": asset(xmarkCircleSolid),
} as const;

export type NucleusIconName = keyof typeof NUCLEUS_ICONS;
