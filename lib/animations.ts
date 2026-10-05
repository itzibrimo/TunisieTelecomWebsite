/* =============================================================================
 * lib/animations.ts — Enterprise Motion Preset System
 *
 * Centralized Framer Motion animation definitions for consistency.
 * All variants use the same premium easing curve [0.16, 1, 0.3, 1].
 * Matches the motion tokens defined in globals.css.
 * ============================================================================= */

/** Premium ease-out-expo — same as Linear, Stripe, Vercel */
const ease = [0.16, 1, 0.3, 1] as const;

/** Spring preset — snappy, natural feel */
const spring = { type: "spring" as const, damping: 30, stiffness: 300 };

/** Gentle spring — for modals, overlays */
const springGentle = { type: "spring" as const, damping: 25, stiffness: 200 };

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE TRANSITIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const pageSlideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.2, ease } },
};

export const pageScale = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease } },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SCROLL REVEALS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease } },
};

export const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
};

export const fadeRight = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STAGGER SYSTEM
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerContainerSlow = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export const staggerItemScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HOVER / INTERACTION STATES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const hoverLift = {
  rest: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  hover: { y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" },
};

export const hoverScale = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
};

export const tapScale = {
  tap: { scale: 0.98 },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   OVERLAY / MODAL / DRAWER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease } },
  exit: { opacity: 0, transition: { duration: 0.15, ease } },
};

export const modalScale = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, scale: 0.95, y: 4, transition: { duration: 0.15, ease } },
};

export const drawerSlide = {
  initial: { x: "100%" },
  animate: { x: 0, transition: spring },
  exit: { x: "100%", transition: { duration: 0.25, ease } },
};

export const drawerSlideLeft = {
  initial: { x: "-100%" },
  animate: { x: 0, transition: spring },
  exit: { x: "-100%", transition: { duration: 0.25, ease } },
};

export const drawerSlideUp = {
  initial: { y: "100%" },
  animate: { y: 0, transition: spring },
  exit: { y: "100%", transition: { duration: 0.25, ease } },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MOBILE MENU
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const mobileMenuSlide = {
  initial: { x: "100%" },
  animate: { x: 0, transition: spring },
  exit: { x: "100%", transition: { duration: 0.25, ease } },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOAST / NOTIFICATION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const toastSlide = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ACCORDION / COLLAPSIBLE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const accordionContent = {
  closed: { height: 0, opacity: 0 },
  open: { height: "auto", opacity: 1, transition: { height: { duration: 0.3, ease }, opacity: { duration: 0.2, delay: 0.1 } } },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TABS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const tabContent = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease } },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TABLE ROW ANIMATIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const tableRowStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

export const tableRow = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
};
