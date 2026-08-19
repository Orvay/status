// src/build.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// ../../packages/design-system/src/tokens.css
var tokens_default = "/* =============================================================================\n   Orvay design tokens\n\n   THE ONLY FILE IN THIS REPOSITORY THAT MAY CONTAIN A COLOUR LITERAL.\n   ESLint errors on any hex, rgb(), hsl() or oklch() elsewhere, and\n   tests/enforcement proves that rule still fires. Spec: docs/plan/08.\n\n   Three tiers:\n     Tier 1  primitives (--o-<ramp>-<step>)  INTERNAL. Components must never\n             reference these. They exist so semantics can be re-pointed without\n             re-deriving colour.\n     Tier 2  semantic (--bg-*, --fg-*, --risk-*, --autonomy-*, ...)  The only\n             tier components consume.\n     Tier 3  component-scoped, defined next to the component that owns it.\n\n   Hue is a scarce budget and it is spent entirely on RISK. Lifecycle is shape,\n   autonomy is container edge, provenance is surface texture, actor is\n   typography and tile geometry. A healthy queue is monochrome, so one amber row\n   is pre-attentively salient rather than one more coloured rectangle.\n\n   Step 9 is theme-invariant but PER RAMP: L(amber-9) > L(ember-9) > L(signal-9)\n   with >= 0.06 separation, so rising risk is a luminance descent and survives\n   greyscale, every form of colour blindness, and a bad projector.\n   tokens.test.ts parses this file and asserts it.\n   ============================================================================= */\n\n:root {\n  /* `light dark` is correct ONLY for the system-default case, where the browser\n     should follow the OS. It must be narrowed the moment a reader picks a theme\n     explicitly, and the two rules below do that.\n\n     Without them, `data-theme='dark'` on a machine set to light leaves every\n     surface the BROWSER draws in light mode while every surface WE draw goes\n     dark: the default button face, form control internals, scrollbars, autofill\n     backgrounds, and the default text colour of any element we forgot to paint.\n     That is not theoretical \u2014 it rendered near-white ink on the UA's near-white\n     `buttonface` at 1.14:1 on the Reject button, on every route, and it looked\n     perfect in light mode where the two happened to agree. */\n  color-scheme: light dark;\n\n  /* No faux-bold, anywhere, ever.\n\n     Measured on the reference: the maximum weight on that entire site is 500.\n     Circular ships only a 500, `b { font-weight: 500 !important }` demotes\n     browser bold, and `font-synthesis: none` blocks the browser from inventing\n     the rest. Hierarchy is carried by size, family, tracking and ink alpha,\n     with weight doing almost no work, and that is the single largest source of\n     the \"expensive\" read (docs/research/warmwind-measurements.md, trap 9).\n\n     Declared here rather than in a component stylesheet because a synthesised\n     weight is a rendering behaviour of the whole document: any surface that\n     forgot to opt out would get a smeared fake bold that no contrast test and\n     no type token can see. Every app imports this file, so every app gets it. */\n  font-synthesis: none;\n\n  /* ---- Tier 1: primitives (light) ---- */\n    /* neutral \u2014 hue 250 */\n    --o-neutral-1: oklch(1.000 0.0000 250);\n    --o-neutral-2: oklch(0.978 0.0010 250);\n    --o-neutral-3: oklch(0.955 0.0000 250);\n    --o-neutral-4: oklch(0.935 0.0015 250);\n    --o-neutral-5: oklch(0.912 0.0020 250);\n    --o-neutral-6: oklch(0.888 0.0025 250);\n    --o-neutral-7: oklch(0.852 0.0030 250);\n    --o-neutral-8: oklch(0.795 0.0035 250);\n    --o-neutral-9: oklch(0.620 0.0045 250);\n    --o-neutral-10: oklch(0.570 0.0050 250);\n    /* L 0.500 measured 4.29:1 against step 6, which is --bg-active. The floor is\n       4.5:1 and nothing caught it, because the contrast suite enumerated INKS\n       against a fixed list of canvases rather than enumerating FILLS. That\n       covers a diagonal of the matrix, not the matrix: primary ink was checked\n       on steps 1-5, secondary ink on step 1 alone, and the interactive ladder\n       (steps 4, 5, 6 = component, hover, active) had no secondary assertion at\n       all. 0.485 clears it at 4.57:1 and still reads as secondary, at 6.39:1 on\n       the raised surface against primary ink's 15:1. */\n    --o-neutral-11: oklch(0.485 0.0055 250);\n    --o-neutral-12: oklch(0.216 0.0075 248);\n    /* The solid-control slab. Not part of the 12-step ramp because it is a\n       two-stop gradient, not a scale position \u2014 the faint vertical fall is what\n       makes the control read as lit from above rather than as flat fill. */\n    --o-slab-top: oklch(0.383 0.0000 250);\n    --o-slab-bottom: oklch(0.256 0.0000 250);\n    /* The slab's ink, declared HERE and never anywhere else.\n       The slab inverts between themes and --o-neutral-9 does not: neutral-9 is\n       L 0.620 in both, so the ink that suits it (dark) is fixed, while the slab\n       runs L 0.26-0.38 in light and L 0.86-0.93 in dark. Wiring the button's\n       colour to --fg-on-solid therefore produced near-black text on a near-black\n       button in LIGHT mode at 1.21:1 \u2014 invisible, on the default theme, on the\n       landing page's main call to action. A fill and its ink have to be declared\n       as a pair, in one place, or they drift apart exactly like this. */\n    --o-slab-ink: var(--o-ink-solid-light);\n    --o-neutral-a1: color-mix(in oklab, var(--o-neutral-1) 4%, transparent);\n    --o-neutral-a2: color-mix(in oklab, var(--o-neutral-2) 8%, transparent);\n    --o-neutral-a3: color-mix(in oklab, var(--o-neutral-3) 12%, transparent);\n    --o-neutral-a4: color-mix(in oklab, var(--o-neutral-4) 16%, transparent);\n    --o-neutral-a5: color-mix(in oklab, var(--o-neutral-5) 22%, transparent);\n    --o-neutral-a6: color-mix(in oklab, var(--o-neutral-6) 30%, transparent);\n    --o-neutral-a7: color-mix(in oklab, var(--o-neutral-7) 40%, transparent);\n    --o-neutral-a8: color-mix(in oklab, var(--o-neutral-8) 55%, transparent);\n    --o-neutral-a9: color-mix(in oklab, var(--o-neutral-9) 100%, transparent);\n    --o-neutral-a10: color-mix(in oklab, var(--o-neutral-10) 100%, transparent);\n    --o-neutral-a11: color-mix(in oklab, var(--o-neutral-11) 80%, transparent);\n    --o-neutral-a12: color-mix(in oklab, var(--o-neutral-12) 60%, transparent);\n    --o-neutral-on-9: var(--o-ink-solid-dark);\n\n    /* steel \u2014 hue 232 */\n    --o-steel-1: oklch(0.994 0.0087 232);\n    --o-steel-2: oklch(0.978 0.0145 232);\n    --o-steel-3: oklch(0.958 0.0232 232);\n    --o-steel-4: oklch(0.938 0.0319 232);\n    --o-steel-5: oklch(0.918 0.0435 232);\n    --o-steel-6: oklch(0.895 0.0551 232);\n    --o-steel-7: oklch(0.858 0.0725 232);\n    --o-steel-8: oklch(0.800 0.0957 232);\n    --o-steel-9: oklch(0.620 0.1450 232);\n    --o-steel-10: oklch(0.575 0.1421 232);\n  /* Step 11 is the INK step, and it has to clear 4.5:1 on every rung of the\n     background ladder rather than on the three anybody thought to check.\n\n     The suite asserted the risk inks on canvases 1, 2 and 3 and left verdant\n     out of the list entirely. Measured across all six rungs in the light theme,\n     every one of the five free inks failed: accent 3.72, verified 3.53, medium\n     3.75, high 3.88, critical 3.97 at their worst. The whole-site sweep caught\n     the verdant case in production markup, at 4.33:1 on the waitlist success\n     message, once its selector was widened to see a `span`.\n\n     These are FREE inks: nothing pairs them with a particular fill, so any of\n     them can land on any surface, and the only honest floor is the worst rung.\n     Dark needed no change; its step 11 sits at L 0.760 against dark grounds. */\n    --o-steel-11: oklch(0.478 0.1044 232);\n    --o-steel-12: oklch(0.255 0.0609 232);\n    --o-steel-a1: color-mix(in oklab, var(--o-steel-1) 4%, transparent);\n    --o-steel-a2: color-mix(in oklab, var(--o-steel-2) 8%, transparent);\n    --o-steel-a3: color-mix(in oklab, var(--o-steel-3) 12%, transparent);\n    --o-steel-a4: color-mix(in oklab, var(--o-steel-4) 16%, transparent);\n    --o-steel-a5: color-mix(in oklab, var(--o-steel-5) 22%, transparent);\n    --o-steel-a6: color-mix(in oklab, var(--o-steel-6) 30%, transparent);\n    --o-steel-a7: color-mix(in oklab, var(--o-steel-7) 40%, transparent);\n    --o-steel-a8: color-mix(in oklab, var(--o-steel-8) 55%, transparent);\n    --o-steel-a9: color-mix(in oklab, var(--o-steel-9) 100%, transparent);\n    --o-steel-a10: color-mix(in oklab, var(--o-steel-10) 100%, transparent);\n    --o-steel-a11: color-mix(in oklab, var(--o-steel-11) 80%, transparent);\n    --o-steel-a12: color-mix(in oklab, var(--o-steel-12) 60%, transparent);\n    --o-steel-on-9: var(--o-ink-solid-dark);\n\n    /* amber \u2014 hue 75 */\n    --o-amber-1: oklch(0.994 0.0081 75);\n    --o-amber-2: oklch(0.978 0.0135 75);\n    --o-amber-3: oklch(0.958 0.0216 75);\n    --o-amber-4: oklch(0.938 0.0297 75);\n    --o-amber-5: oklch(0.918 0.0405 75);\n    --o-amber-6: oklch(0.895 0.0513 75);\n    --o-amber-7: oklch(0.858 0.0675 75);\n    --o-amber-8: oklch(0.800 0.0891 75);\n    --o-amber-9: oklch(0.700 0.1350 75);\n    --o-amber-10: oklch(0.655 0.1323 75);\n    --o-amber-11: oklch(0.490 0.0972 75);\n    --o-amber-12: oklch(0.255 0.0567 75);\n    --o-amber-a1: color-mix(in oklab, var(--o-amber-1) 4%, transparent);\n    --o-amber-a2: color-mix(in oklab, var(--o-amber-2) 8%, transparent);\n    --o-amber-a3: color-mix(in oklab, var(--o-amber-3) 12%, transparent);\n    --o-amber-a4: color-mix(in oklab, var(--o-amber-4) 16%, transparent);\n    --o-amber-a5: color-mix(in oklab, var(--o-amber-5) 22%, transparent);\n    --o-amber-a6: color-mix(in oklab, var(--o-amber-6) 30%, transparent);\n    --o-amber-a7: color-mix(in oklab, var(--o-amber-7) 40%, transparent);\n    --o-amber-a8: color-mix(in oklab, var(--o-amber-8) 55%, transparent);\n    --o-amber-a9: color-mix(in oklab, var(--o-amber-9) 100%, transparent);\n    --o-amber-a10: color-mix(in oklab, var(--o-amber-10) 100%, transparent);\n    --o-amber-a11: color-mix(in oklab, var(--o-amber-11) 80%, transparent);\n    --o-amber-a12: color-mix(in oklab, var(--o-amber-12) 60%, transparent);\n    --o-amber-on-9: var(--o-ink-solid-dark);\n\n    /* ember \u2014 hue 45 */\n    --o-ember-1: oklch(0.994 0.0099 45);\n    --o-ember-2: oklch(0.978 0.0165 45);\n    --o-ember-3: oklch(0.958 0.0264 45);\n    --o-ember-4: oklch(0.938 0.0363 45);\n    --o-ember-5: oklch(0.918 0.0495 45);\n    --o-ember-6: oklch(0.895 0.0627 45);\n    --o-ember-7: oklch(0.858 0.0825 45);\n    --o-ember-8: oklch(0.800 0.1089 45);\n    --o-ember-9: oklch(0.630 0.1650 45);\n    --o-ember-10: oklch(0.585 0.1617 45);\n    --o-ember-11: oklch(0.500 0.1188 45);\n    --o-ember-12: oklch(0.255 0.0693 45);\n    --o-ember-a1: color-mix(in oklab, var(--o-ember-1) 4%, transparent);\n    --o-ember-a2: color-mix(in oklab, var(--o-ember-2) 8%, transparent);\n    --o-ember-a3: color-mix(in oklab, var(--o-ember-3) 12%, transparent);\n    --o-ember-a4: color-mix(in oklab, var(--o-ember-4) 16%, transparent);\n    --o-ember-a5: color-mix(in oklab, var(--o-ember-5) 22%, transparent);\n    --o-ember-a6: color-mix(in oklab, var(--o-ember-6) 30%, transparent);\n    --o-ember-a7: color-mix(in oklab, var(--o-ember-7) 40%, transparent);\n    --o-ember-a8: color-mix(in oklab, var(--o-ember-8) 55%, transparent);\n    --o-ember-a9: color-mix(in oklab, var(--o-ember-9) 100%, transparent);\n    --o-ember-a10: color-mix(in oklab, var(--o-ember-10) 100%, transparent);\n    --o-ember-a11: color-mix(in oklab, var(--o-ember-11) 80%, transparent);\n    --o-ember-a12: color-mix(in oklab, var(--o-ember-12) 60%, transparent);\n    --o-ember-on-9: var(--o-ink-solid-dark);\n\n    /* signal \u2014 hue 25 */\n    --o-signal-1: oklch(0.994 0.0118 25);\n    --o-signal-2: oklch(0.978 0.0196 25);\n    --o-signal-3: oklch(0.958 0.0314 25);\n    --o-signal-4: oklch(0.938 0.0431 25);\n    --o-signal-5: oklch(0.918 0.0588 25);\n    --o-signal-6: oklch(0.895 0.0745 25);\n    --o-signal-7: oklch(0.858 0.0980 25);\n    --o-signal-8: oklch(0.800 0.1294 25);\n    --o-signal-9: oklch(0.560 0.1960 25);\n    --o-signal-10: oklch(0.515 0.1921 25);\n    --o-signal-11: oklch(0.505 0.1411 25);\n    --o-signal-12: oklch(0.255 0.0823 25);\n    --o-signal-a1: color-mix(in oklab, var(--o-signal-1) 4%, transparent);\n    --o-signal-a2: color-mix(in oklab, var(--o-signal-2) 8%, transparent);\n    --o-signal-a3: color-mix(in oklab, var(--o-signal-3) 12%, transparent);\n    --o-signal-a4: color-mix(in oklab, var(--o-signal-4) 16%, transparent);\n    --o-signal-a5: color-mix(in oklab, var(--o-signal-5) 22%, transparent);\n    --o-signal-a6: color-mix(in oklab, var(--o-signal-6) 30%, transparent);\n    --o-signal-a7: color-mix(in oklab, var(--o-signal-7) 40%, transparent);\n    --o-signal-a8: color-mix(in oklab, var(--o-signal-8) 55%, transparent);\n    --o-signal-a9: color-mix(in oklab, var(--o-signal-9) 100%, transparent);\n    --o-signal-a10: color-mix(in oklab, var(--o-signal-10) 100%, transparent);\n    --o-signal-a11: color-mix(in oklab, var(--o-signal-11) 80%, transparent);\n    --o-signal-a12: color-mix(in oklab, var(--o-signal-12) 60%, transparent);\n    --o-signal-on-9: var(--o-ink-solid-light);\n\n    /* verdant \u2014 hue 152 */\n    --o-verdant-1: oklch(0.994 0.0081 152);\n    --o-verdant-2: oklch(0.978 0.0135 152);\n    --o-verdant-3: oklch(0.958 0.0216 152);\n    --o-verdant-4: oklch(0.938 0.0297 152);\n    --o-verdant-5: oklch(0.918 0.0405 152);\n    --o-verdant-6: oklch(0.895 0.0513 152);\n    --o-verdant-7: oklch(0.858 0.0675 152);\n    --o-verdant-8: oklch(0.800 0.0891 152);\n    --o-verdant-9: oklch(0.620 0.1350 152);\n    --o-verdant-10: oklch(0.575 0.1323 152);\n    --o-verdant-11: oklch(0.475 0.0972 152);\n    --o-verdant-12: oklch(0.255 0.0567 152);\n    --o-verdant-a1: color-mix(in oklab, var(--o-verdant-1) 4%, transparent);\n    --o-verdant-a2: color-mix(in oklab, var(--o-verdant-2) 8%, transparent);\n    --o-verdant-a3: color-mix(in oklab, var(--o-verdant-3) 12%, transparent);\n    --o-verdant-a4: color-mix(in oklab, var(--o-verdant-4) 16%, transparent);\n    --o-verdant-a5: color-mix(in oklab, var(--o-verdant-5) 22%, transparent);\n    --o-verdant-a6: color-mix(in oklab, var(--o-verdant-6) 30%, transparent);\n    --o-verdant-a7: color-mix(in oklab, var(--o-verdant-7) 40%, transparent);\n    --o-verdant-a8: color-mix(in oklab, var(--o-verdant-8) 55%, transparent);\n    --o-verdant-a9: color-mix(in oklab, var(--o-verdant-9) 100%, transparent);\n    --o-verdant-a10: color-mix(in oklab, var(--o-verdant-10) 100%, transparent);\n    --o-verdant-a11: color-mix(in oklab, var(--o-verdant-11) 80%, transparent);\n    --o-verdant-a12: color-mix(in oklab, var(--o-verdant-12) 60%, transparent);\n    --o-verdant-on-9: var(--o-ink-solid-dark);\n\n  /* Ink for step-9 solids. Body ink (step 12) is deliberately not pure, which\n     makes it too light to reach 4.5:1 on a mid-lightness solid \u2014 4.32:1 on\n     neutral-9. Solids get their own inks, and because step 9 is\n     theme-invariant, so is its ink. Which one each ramp takes is derived from\n     the contrast maths, not chosen: only signal-9 is dark enough for light ink.\n     Asserted in tokens.test.ts. */\n  --o-ink-solid-dark: oklch(0.170 0.006 250);\n  --o-ink-solid-light: oklch(0.985 0.004 250);\n\n  /* ---- Weight ramp: off the CSS keyword ladder (\xA74.1), and capped ----\n\n     Off the ladder so that `font-weight: bold` can never be reached for by\n     habit; capped at 530 because the reference's maximum weight is 500 and\n     `font-synthesis: none` above blocks the browser from faking anything\n     heavier. A 620 in a system whose hierarchy is carried by size, family,\n     tracking and ink alpha is the one addition that most reliably destroys the\n     read (measurements, trap 9). tokens.test.ts asserts the cap numerically, so\n     reintroducing a heavier step fails rather than merely disagreeing with this\n     comment. */\n  --o-weight-regular: 400;\n  --o-weight-medium: 460;\n  --o-weight-strong: 530;\n  /* ---- Type scale: tracking is a function of size and inverts (\xA74.3) ---- */\n  /* The first entry in each stack is the face next/font generates in every app's\n     root layout, which resolves to the self-hosted family plus the fallback Next\n     derives from its real metrics. The literal names behind it are what a\n     surface rendered outside a Next app gets, which is how this file is read by\n     the token tests and the specimen sheet.\n\n     The var() carries a DEFAULT rather than standing alone, and that is\n     load-bearing: an undefined custom property makes the whole declaration\n     invalid at computed-value time, so a bare var(--o-font-sans-face) would drop\n     the entire stack rather than skip one absent entry. The failure would look\n     like a serif page, not like a missing font.\n\n     Before 2026-08-18 both stacks named families that nothing loaded, so every\n     surface rendered in system-ui while the tokens claimed otherwise. */\n  --o-font-sans: var(--o-font-sans-face, InterVariable), Inter, ui-sans-serif, system-ui, sans-serif;\n  --o-font-mono: var(--o-font-mono-face, \"IBM Plex Mono\"), ui-monospace, SFMono-Regular, monospace;\n\n  --o-text-display-32: 2rem/2.3rem var(--o-font-sans);\n  --o-tracking-display-32: -0.04em;\n  --o-text-title-24: 1.5rem/1.75rem var(--o-font-sans);\n  --o-tracking-title-24: -0.03em;\n  --o-text-title-19: 1.1875rem/1.5rem var(--o-font-sans);\n  --o-tracking-title-19: -0.025em;\n  --o-text-body-15: 0.9375rem/1.5rem var(--o-font-sans);\n  --o-tracking-body-15: -0.015em;\n  --o-text-label-14: 0.875rem/1rem var(--o-font-sans);\n  --o-tracking-label-14: -0.0125em;\n  --o-text-mono-13: 0.8125rem/1.25rem var(--o-font-mono);\n  --o-tracking-mono-13: 0em;\n  --o-text-micro-11: 0.6875rem/0.875rem var(--o-font-sans);\n  --o-tracking-micro-11: 0.012em;\n\n  /* Chrome tracks in ABSOLUTE PIXELS. Text tracks in percentages.\n\n     The convention deliberately flips at the chrome tier, and missing the flip\n     is what makes buttons look loose (measurements, trap 8). Text tracking is a\n     percentage so it scales with a fluid size; a control label is not fluid, it\n     is a fixed piece of furniture, and it wants a fixed optical correction.\n\n     Measured on the reference: button labels -0.35px, badges -0.2px, numerics\n     -0.5px with tabular figures. Note the size of the effect. `.Button\n     .Paragraph` OVERRIDES the paragraph's -1.5%, and at 16px that is -0.24px\n     against -0.35px, so a button label is tracked ~46% tighter than identical\n     body text sitting beside it. */\n  --o-tracking-control: -0.35px;\n  --o-tracking-badge: -0.2px;\n  --o-tracking-numeric: -0.5px;\n\n  /* ---- Space, radius, hairlines ---- */\n  --o-space-1: 0.25rem;  --o-space-2: 0.5rem;   --o-space-3: 0.75rem;\n  --o-space-4: 1rem;     --o-space-5: 1.5rem;   --o-space-6: 2rem;\n  --o-space-7: 3rem;     --o-space-8: 4rem;\n  --o-radius-sm: 8px;    --o-radius-md: 12px;   --o-radius-lg: 20px;\n  /* Two shapes carry the whole language: controls are fully round, surfaces\n     are generously rounded. Nothing in between, which is what stops the UI\n     drifting into a dozen near-identical corner radii. */\n  --o-radius-pill: 1000px;\n  --o-radius-panel: 30px;\n\n  /* ---------------------------------------------------------------------------\n     Bevel \u2014 where the \"glass\" impression actually comes from.\n\n     Measured on the reference (warmwind.com, 2026-08-09): there is NO\n     backdrop-filter anywhere on that page. Zero. The glassy quality is made\n     entirely from a white INSET highlight along the top edge plus a soft outer\n     shadow \u2014 a simulated bevel catching light, not a blurred backdrop.\n\n     That distinction is worth the paragraph, because backdrop-filter is\n     expensive to composite, disappears under forced-colors, and prints as\n     nothing. This achieves the same read with none of those costs.\n     ------------------------------------------------------------------------- */\n  --o-bevel-control:\n    inset 0 1px 1px 0 color-mix(in oklab, white 20%, transparent),\n    0 1px 2px -0.5px color-mix(in oklab, var(--o-neutral-12) 10%, transparent);\n  --o-bevel-control-solid:\n    0 1px 8px -3px color-mix(in oklab, var(--o-neutral-12) 20%, transparent),\n    inset 0.5px 0 0 0 color-mix(in oklab, var(--o-neutral-12) 10%, transparent),\n    inset -0.5px 0 0 0 color-mix(in oklab, var(--o-neutral-12) 10%, transparent),\n    inset 0 1.25px 0 -0.5px color-mix(in oklab, white 30%, transparent),\n    inset 0 -1.25px 0 -0.5px color-mix(in oklab, white 30%, transparent);\n  /* Measured off the reference card, not off its icon well. The previous recipe\n     here was `0 23px 29px` plus a 24px opaque-white inner glow, which is the\n     reference's .IconBox-Inner svg shadow -- a 60px lens -- applied to a 1000px\n     card. On an icon it reads as glass; on a card it is a lamp.\n     The real card is held up by the 15-unit luminance step from ground to\n     surface. The outer shadow is deliberately almost erased: a -10px spread on\n     a 12px blur measures 8/255 of darkening at its strongest. Any shadow you\n     would reach for by instinct is an order of magnitude louder. */\n  --o-bevel-raised:\n    inset 0 -0.5px 0.25px 0 color-mix(in oklab, var(--o-neutral-12) 16%, transparent),\n    inset 0 0.5px 0.25px 0 color-mix(in oklab, var(--o-neutral-12) 12%, transparent),\n    inset 0 2px 4px 0 color-mix(in oklab, white 40%, transparent),\n    inset 0 -2px 4px 0 color-mix(in oklab, white 40%, transparent),\n    0 5px 12px -10px color-mix(in oklab, var(--o-neutral-12) 20%, transparent);\n  /* The resting half of the pair. Elevation here is not a translate or a scale:\n     it is this swapping to --o-bevel-raised, six alpha points deeper. An\n     interactive surface must rest on THIS one, or it has nowhere to hover to. */\n  --o-bevel-resting:\n    inset 0 -0.5px 0.25px 0 color-mix(in oklab, var(--o-neutral-12) 10%, transparent),\n    inset 0 0.5px 0.25px 0 color-mix(in oklab, var(--o-neutral-12) 8%, transparent),\n    inset 0 2px 4px 0 color-mix(in oklab, white 40%, transparent),\n    inset 0 -2px 4px 0 color-mix(in oklab, white 40%, transparent),\n    0 4px 10px -8px color-mix(in oklab, var(--o-neutral-12) 10%, transparent);\n  /* Pressed into the ground rather than lifted off it \u2014 a double inset\n     vignette, top and bottom, for wells and inputs. */\n  --o-bevel-inset:\n    inset 0 -2.5px 15px 0 color-mix(in oklab, var(--o-neutral-12) 2%, transparent),\n    inset 0 2.5px 15px 0 color-mix(in oklab, var(--o-neutral-12) 2%, transparent);\n  /* Sub-pixel rims: the hairline that separates without drawing a border. */\n  --o-bevel-rim:\n    inset 0 -0.5px 0.25px 0 color-mix(in oklab, var(--o-neutral-12) 16%, transparent),\n    inset 0 0.5px 0.25px 0 color-mix(in oklab, var(--o-neutral-12) 12%, transparent);\n  --o-hairline: 1px;\n  --o-tap-min: 44px;\n\n  /* ---- Motion: meaning only, never decoration (\xA76) ----\n\n     Two registers, and they are not interchangeable.\n\n     CONTROL FEEDBACK answers \"did it hear me\", so it is fast and symmetric and\n     it never sits on a decision's critical path. Approve, reject, select and\n     halt are 0ms, always.\n\n     ENTER AND EXIT answer \"where did this come from and where did it go\", and\n     the reference's whole motion vocabulary is one asymmetric pair, measured:\n     0.225s in on cubic-bezier(.23, 1, .32, 1), 0.15s out on\n     cubic-bezier(.77, 0, .175, 1). The exit is 33% faster AND a completely\n     different shape. A symmetric ease-out at 300ms with 24px of travel reads as\n     a template (measurements, \xA712 and trap 16). */\n  --o-dur-instant: 80ms;\n  --o-dur-quick: 140ms;\n  --o-dur-considered: 240ms;\n  --o-ease-standard: cubic-bezier(0.32, 0.08, 0.24, 1);\n\n  /* The measured pair, verbatim rather than rounded to the duration scale. A\n     motion curve is not a spacing rung: 225 and 150 are the values that were\n     read off the reference, and rounding them to 220 and 160 for tidiness would\n     be substituting taste for the measurement this file exists to record. */\n  --o-dur-enter: 225ms;\n  --o-ease-enter: cubic-bezier(0.23, 1, 0.32, 1);\n  --o-dur-exit: 150ms;\n  /* Previously cubic-bezier(0.4, 0, 1, 1), a plain ease-in, and referenced by\n     nothing. docs/plan/08 \xA76.3 states there is no ease-in curve in the token\n     set; that was already untrue of --o-ease-standard, whose first control\n     point sits below the diagonal. The amendment recorded in \xA76.3 is: the\n     asymmetric pair governs reveals and exits, and ease-out governs anything a\n     click is waiting on. An exit may accelerate away, because nobody is waiting\n     for a thing that has already left. */\n  --o-ease-exit: cubic-bezier(0.77, 0, 0.175, 1);\n\n  /* Reveals travel 4px, not 24px, and run once.\n     Measured: `whileInView opacity 0 -> 1, translateY(4px) -> 0`, 0.225s, 0.1s\n     delay, viewport once. The restraint is the point. A 24px reveal announces\n     itself; a 4px reveal is felt and not seen, which is the only kind of motion\n     a supervision surface can afford. */\n  --o-travel-reveal: 4px;\n  /* Blur is part of the enter, not decoration: the reference's section and\n     slide presets carry 3px and 4px in their initial and exit states. */\n  --o-blur-enter: 3px;\n  /* 0.05s x index, measured. Staggering beyond a handful of items turns a list\n     into a performance, so this is for rows arriving, never for rows present. */\n  --o-stagger-unit: 50ms;\n\n  /* Kept as aliases of the measured pair. They are the names apps already use,\n     and repointing them here is what makes the correction reach every consumer\n     without this session editing a surface it does not own. */\n  --o-dur-reveal: var(--o-dur-enter);\n  --o-ease-reveal: var(--o-ease-enter);\n\n  /* ---- Elevation: the halt control is exempt from overlay depth (\xA70 G) ---- */\n  --o-z-content: 0;\n  --o-z-sticky: 10;\n  --o-z-overlay: 100;\n  --o-z-halt: 1000;\n}\n\n\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme='light']) {\n    /* neutral \u2014 hue 250 */\n    --o-neutral-1: oklch(0.160 0.0040 250);\n    --o-neutral-2: oklch(0.190 0.0055 250);\n    --o-neutral-3: oklch(0.220 0.0069 250);\n    --o-neutral-4: oklch(0.250 0.0084 250);\n    --o-neutral-5: oklch(0.280 0.0098 250);\n    --o-neutral-6: oklch(0.310 0.0113 250);\n    --o-neutral-7: oklch(0.365 0.0113 250);\n    --o-neutral-8: oklch(0.435 0.0098 250);\n    --o-neutral-9: oklch(0.620 0.0084 250);\n    --o-neutral-10: oklch(0.665 0.0069 250);\n    --o-neutral-11: oklch(0.760 0.0055 250);\n    --o-neutral-12: oklch(0.955 0.0040 250);\n    --o-slab-top: oklch(0.930 0.0030 250);\n    --o-slab-bottom: oklch(0.860 0.0030 250);\n    /* Inverted with the slab. See the note in the light block. */\n    --o-slab-ink: var(--o-ink-solid-dark);\n    --o-neutral-a1: color-mix(in oklab, var(--o-neutral-1) 4%, transparent);\n    --o-neutral-a2: color-mix(in oklab, var(--o-neutral-2) 8%, transparent);\n    --o-neutral-a3: color-mix(in oklab, var(--o-neutral-3) 12%, transparent);\n    --o-neutral-a4: color-mix(in oklab, var(--o-neutral-4) 16%, transparent);\n    --o-neutral-a5: color-mix(in oklab, var(--o-neutral-5) 22%, transparent);\n    --o-neutral-a6: color-mix(in oklab, var(--o-neutral-6) 30%, transparent);\n    --o-neutral-a7: color-mix(in oklab, var(--o-neutral-7) 40%, transparent);\n    --o-neutral-a8: color-mix(in oklab, var(--o-neutral-8) 55%, transparent);\n    --o-neutral-a9: color-mix(in oklab, var(--o-neutral-9) 100%, transparent);\n    --o-neutral-a10: color-mix(in oklab, var(--o-neutral-10) 100%, transparent);\n    --o-neutral-a11: color-mix(in oklab, var(--o-neutral-11) 80%, transparent);\n    --o-neutral-a12: color-mix(in oklab, var(--o-neutral-12) 60%, transparent);\n    --o-neutral-on-9: var(--o-ink-solid-dark);\n\n    /* steel \u2014 hue 232 */\n    --o-steel-1: oklch(0.160 0.0079 232);\n    --o-steel-2: oklch(0.190 0.0132 232);\n    --o-steel-3: oklch(0.220 0.0211 232);\n    --o-steel-4: oklch(0.250 0.0290 232);\n    --o-steel-5: oklch(0.280 0.0396 232);\n    --o-steel-6: oklch(0.310 0.0501 232);\n    --o-steel-7: oklch(0.365 0.0660 232);\n    --o-steel-8: oklch(0.435 0.0871 232);\n    --o-steel-9: oklch(0.620 0.1319 232);\n    --o-steel-10: oklch(0.665 0.1293 232);\n    --o-steel-11: oklch(0.760 0.0950 232);\n    --o-steel-12: oklch(0.955 0.0554 232);\n    --o-steel-a1: color-mix(in oklab, var(--o-steel-1) 4%, transparent);\n    --o-steel-a2: color-mix(in oklab, var(--o-steel-2) 8%, transparent);\n    --o-steel-a3: color-mix(in oklab, var(--o-steel-3) 12%, transparent);\n    --o-steel-a4: color-mix(in oklab, var(--o-steel-4) 16%, transparent);\n    --o-steel-a5: color-mix(in oklab, var(--o-steel-5) 22%, transparent);\n    --o-steel-a6: color-mix(in oklab, var(--o-steel-6) 30%, transparent);\n    --o-steel-a7: color-mix(in oklab, var(--o-steel-7) 40%, transparent);\n    --o-steel-a8: color-mix(in oklab, var(--o-steel-8) 55%, transparent);\n    --o-steel-a9: color-mix(in oklab, var(--o-steel-9) 100%, transparent);\n    --o-steel-a10: color-mix(in oklab, var(--o-steel-10) 100%, transparent);\n    --o-steel-a11: color-mix(in oklab, var(--o-steel-11) 80%, transparent);\n    --o-steel-a12: color-mix(in oklab, var(--o-steel-12) 60%, transparent);\n    --o-steel-on-9: var(--o-ink-solid-dark);\n\n    /* amber \u2014 hue 75 */\n    --o-amber-1: oklch(0.160 0.0074 75);\n    --o-amber-2: oklch(0.190 0.0123 75);\n    --o-amber-3: oklch(0.220 0.0197 75);\n    --o-amber-4: oklch(0.250 0.0270 75);\n    --o-amber-5: oklch(0.280 0.0369 75);\n    --o-amber-6: oklch(0.310 0.0467 75);\n    --o-amber-7: oklch(0.365 0.0614 75);\n    --o-amber-8: oklch(0.435 0.0811 75);\n    --o-amber-9: oklch(0.700 0.1229 75);\n    --o-amber-10: oklch(0.745 0.1204 75);\n    --o-amber-11: oklch(0.760 0.0885 75);\n    --o-amber-12: oklch(0.955 0.0516 75);\n    --o-amber-a1: color-mix(in oklab, var(--o-amber-1) 4%, transparent);\n    --o-amber-a2: color-mix(in oklab, var(--o-amber-2) 8%, transparent);\n    --o-amber-a3: color-mix(in oklab, var(--o-amber-3) 12%, transparent);\n    --o-amber-a4: color-mix(in oklab, var(--o-amber-4) 16%, transparent);\n    --o-amber-a5: color-mix(in oklab, var(--o-amber-5) 22%, transparent);\n    --o-amber-a6: color-mix(in oklab, var(--o-amber-6) 30%, transparent);\n    --o-amber-a7: color-mix(in oklab, var(--o-amber-7) 40%, transparent);\n    --o-amber-a8: color-mix(in oklab, var(--o-amber-8) 55%, transparent);\n    --o-amber-a9: color-mix(in oklab, var(--o-amber-9) 100%, transparent);\n    --o-amber-a10: color-mix(in oklab, var(--o-amber-10) 100%, transparent);\n    --o-amber-a11: color-mix(in oklab, var(--o-amber-11) 80%, transparent);\n    --o-amber-a12: color-mix(in oklab, var(--o-amber-12) 60%, transparent);\n    --o-amber-on-9: var(--o-ink-solid-dark);\n\n    /* ember \u2014 hue 45 */\n    --o-ember-1: oklch(0.160 0.0090 45);\n    --o-ember-2: oklch(0.190 0.0150 45);\n    --o-ember-3: oklch(0.220 0.0240 45);\n    --o-ember-4: oklch(0.250 0.0330 45);\n    --o-ember-5: oklch(0.280 0.0450 45);\n    --o-ember-6: oklch(0.310 0.0571 45);\n    --o-ember-7: oklch(0.365 0.0751 45);\n    --o-ember-8: oklch(0.435 0.0991 45);\n    --o-ember-9: oklch(0.630 0.1502 45);\n    --o-ember-10: oklch(0.675 0.1471 45);\n    --o-ember-11: oklch(0.760 0.1081 45);\n    --o-ember-12: oklch(0.955 0.0631 45);\n    --o-ember-a1: color-mix(in oklab, var(--o-ember-1) 4%, transparent);\n    --o-ember-a2: color-mix(in oklab, var(--o-ember-2) 8%, transparent);\n    --o-ember-a3: color-mix(in oklab, var(--o-ember-3) 12%, transparent);\n    --o-ember-a4: color-mix(in oklab, var(--o-ember-4) 16%, transparent);\n    --o-ember-a5: color-mix(in oklab, var(--o-ember-5) 22%, transparent);\n    --o-ember-a6: color-mix(in oklab, var(--o-ember-6) 30%, transparent);\n    --o-ember-a7: color-mix(in oklab, var(--o-ember-7) 40%, transparent);\n    --o-ember-a8: color-mix(in oklab, var(--o-ember-8) 55%, transparent);\n    --o-ember-a9: color-mix(in oklab, var(--o-ember-9) 100%, transparent);\n    --o-ember-a10: color-mix(in oklab, var(--o-ember-10) 100%, transparent);\n    --o-ember-a11: color-mix(in oklab, var(--o-ember-11) 80%, transparent);\n    --o-ember-a12: color-mix(in oklab, var(--o-ember-12) 60%, transparent);\n    --o-ember-on-9: var(--o-ink-solid-dark);\n\n    /* signal \u2014 hue 25 */\n    --o-signal-1: oklch(0.160 0.0107 25);\n    --o-signal-2: oklch(0.190 0.0178 25);\n    --o-signal-3: oklch(0.220 0.0285 25);\n    --o-signal-4: oklch(0.250 0.0392 25);\n    --o-signal-5: oklch(0.280 0.0535 25);\n    --o-signal-6: oklch(0.310 0.0678 25);\n    --o-signal-7: oklch(0.365 0.0892 25);\n    --o-signal-8: oklch(0.435 0.1177 25);\n    --o-signal-9: oklch(0.560 0.1784 25);\n    --o-signal-10: oklch(0.605 0.1748 25);\n    --o-signal-11: oklch(0.760 0.1284 25);\n    --o-signal-12: oklch(0.955 0.0749 25);\n    --o-signal-a1: color-mix(in oklab, var(--o-signal-1) 4%, transparent);\n    --o-signal-a2: color-mix(in oklab, var(--o-signal-2) 8%, transparent);\n    --o-signal-a3: color-mix(in oklab, var(--o-signal-3) 12%, transparent);\n    --o-signal-a4: color-mix(in oklab, var(--o-signal-4) 16%, transparent);\n    --o-signal-a5: color-mix(in oklab, var(--o-signal-5) 22%, transparent);\n    --o-signal-a6: color-mix(in oklab, var(--o-signal-6) 30%, transparent);\n    --o-signal-a7: color-mix(in oklab, var(--o-signal-7) 40%, transparent);\n    --o-signal-a8: color-mix(in oklab, var(--o-signal-8) 55%, transparent);\n    --o-signal-a9: color-mix(in oklab, var(--o-signal-9) 100%, transparent);\n    --o-signal-a10: color-mix(in oklab, var(--o-signal-10) 100%, transparent);\n    --o-signal-a11: color-mix(in oklab, var(--o-signal-11) 80%, transparent);\n    --o-signal-a12: color-mix(in oklab, var(--o-signal-12) 60%, transparent);\n    --o-signal-on-9: var(--o-ink-solid-light);\n\n    /* verdant \u2014 hue 152 */\n    --o-verdant-1: oklch(0.160 0.0074 152);\n    --o-verdant-2: oklch(0.190 0.0123 152);\n    --o-verdant-3: oklch(0.220 0.0197 152);\n    --o-verdant-4: oklch(0.250 0.0270 152);\n    --o-verdant-5: oklch(0.280 0.0369 152);\n    --o-verdant-6: oklch(0.310 0.0467 152);\n    --o-verdant-7: oklch(0.365 0.0614 152);\n    --o-verdant-8: oklch(0.435 0.0811 152);\n    --o-verdant-9: oklch(0.620 0.1229 152);\n    --o-verdant-10: oklch(0.665 0.1204 152);\n    --o-verdant-11: oklch(0.760 0.0885 152);\n    --o-verdant-12: oklch(0.955 0.0516 152);\n    --o-verdant-a1: color-mix(in oklab, var(--o-verdant-1) 4%, transparent);\n    --o-verdant-a2: color-mix(in oklab, var(--o-verdant-2) 8%, transparent);\n    --o-verdant-a3: color-mix(in oklab, var(--o-verdant-3) 12%, transparent);\n    --o-verdant-a4: color-mix(in oklab, var(--o-verdant-4) 16%, transparent);\n    --o-verdant-a5: color-mix(in oklab, var(--o-verdant-5) 22%, transparent);\n    --o-verdant-a6: color-mix(in oklab, var(--o-verdant-6) 30%, transparent);\n    --o-verdant-a7: color-mix(in oklab, var(--o-verdant-7) 40%, transparent);\n    --o-verdant-a8: color-mix(in oklab, var(--o-verdant-8) 55%, transparent);\n    --o-verdant-a9: color-mix(in oklab, var(--o-verdant-9) 100%, transparent);\n    --o-verdant-a10: color-mix(in oklab, var(--o-verdant-10) 100%, transparent);\n    --o-verdant-a11: color-mix(in oklab, var(--o-verdant-11) 80%, transparent);\n    --o-verdant-a12: color-mix(in oklab, var(--o-verdant-12) 60%, transparent);\n    --o-verdant-on-9: var(--o-ink-solid-dark);\n\n    /* -------------------------------------------------------------------------\n       Bevel, re-derived for a dark ground.\n\n       These MUST be restated per theme, and the reason is geometric rather than\n       chromatic. In light, a card is lifted by pooling white INSIDE its lower\n       edge -- white on white reads as a soft interior lift. Do the same thing on\n       a dark card and you get a lamp. The dark equivalent of \"lifted\" is a\n       lighter surface, a hairline of light caught on the TOP edge, and a shadow\n       that is actually dark. Different shapes, not the same shape recoloured, so\n       one shared recipe with swapped colours cannot express both.\n\n       Leaving them undefined here was a real, shipped bug: every shadow is mixed\n       from --o-neutral-12, which is near-black in light and near-white in dark,\n       so every shadow in the product inverted into a glow, and --o-bevel-raised\n       carried a 100%-opacity white inset that turned every card into a halo.\n\n       Shadows are mixed from black rather than from an ink token on purpose: a\n       shadow is an absence of light, and it must not follow the text colour when\n       the theme flips. That coupling is what broke.\n       ---------------------------------------------------------------------- */\n    --o-bevel-control:\n      inset 0 1px 0 0 color-mix(in oklab, white 8%, transparent),\n      0 1px 2px -0.5px color-mix(in oklab, black 55%, transparent);\n    --o-bevel-control-solid:\n      0 1px 8px -3px color-mix(in oklab, black 70%, transparent),\n      inset 0.5px 0 0 0 color-mix(in oklab, black 40%, transparent),\n      inset -0.5px 0 0 0 color-mix(in oklab, black 40%, transparent),\n      inset 0 1.25px 0 -0.5px color-mix(in oklab, white 14%, transparent),\n      inset 0 -1.25px 0 -0.5px color-mix(in oklab, white 8%, transparent);\n    --o-bevel-raised:\n      inset 0 0.5px 0.25px 0 color-mix(in oklab, white 10%, transparent),\n      inset 0 -0.5px 0.25px 0 color-mix(in oklab, black 50%, transparent),\n      inset 0 2px 4px 0 color-mix(in oklab, white 4%, transparent),\n      0 5px 12px -10px color-mix(in oklab, black 75%, transparent);\n    --o-bevel-resting:\n      inset 0 0.5px 0.25px 0 color-mix(in oklab, white 6%, transparent),\n      inset 0 -0.5px 0.25px 0 color-mix(in oklab, black 40%, transparent),\n      0 4px 10px -8px color-mix(in oklab, black 60%, transparent);\n    --o-bevel-inset:\n      inset 0 -2.5px 15px 0 color-mix(in oklab, black 24%, transparent),\n      inset 0 2.5px 15px 0 color-mix(in oklab, black 24%, transparent);\n    /* The rim inverts, and only in dark: light collects on the top edge and the\n       bottom edge falls into shadow. In light both edges are ink. */\n    --o-bevel-rim:\n      inset 0 0.5px 0.25px 0 color-mix(in oklab, white 9%, transparent),\n      inset 0 -0.5px 0.25px 0 color-mix(in oklab, black 45%, transparent);\n  }\n}\n\n:root[data-theme='dark'] {\n    /* neutral \u2014 hue 250 */\n    --o-neutral-1: oklch(0.160 0.0040 250);\n    --o-neutral-2: oklch(0.190 0.0055 250);\n    --o-neutral-3: oklch(0.220 0.0069 250);\n    --o-neutral-4: oklch(0.250 0.0084 250);\n    --o-neutral-5: oklch(0.280 0.0098 250);\n    --o-neutral-6: oklch(0.310 0.0113 250);\n    --o-neutral-7: oklch(0.365 0.0113 250);\n    --o-neutral-8: oklch(0.435 0.0098 250);\n    --o-neutral-9: oklch(0.620 0.0084 250);\n    --o-neutral-10: oklch(0.665 0.0069 250);\n    --o-neutral-11: oklch(0.760 0.0055 250);\n    --o-neutral-12: oklch(0.955 0.0040 250);\n    --o-slab-top: oklch(0.930 0.0030 250);\n    --o-slab-bottom: oklch(0.860 0.0030 250);\n    /* Inverted with the slab. See the note in the light block. */\n    --o-slab-ink: var(--o-ink-solid-dark);\n    --o-neutral-a1: color-mix(in oklab, var(--o-neutral-1) 4%, transparent);\n    --o-neutral-a2: color-mix(in oklab, var(--o-neutral-2) 8%, transparent);\n    --o-neutral-a3: color-mix(in oklab, var(--o-neutral-3) 12%, transparent);\n    --o-neutral-a4: color-mix(in oklab, var(--o-neutral-4) 16%, transparent);\n    --o-neutral-a5: color-mix(in oklab, var(--o-neutral-5) 22%, transparent);\n    --o-neutral-a6: color-mix(in oklab, var(--o-neutral-6) 30%, transparent);\n    --o-neutral-a7: color-mix(in oklab, var(--o-neutral-7) 40%, transparent);\n    --o-neutral-a8: color-mix(in oklab, var(--o-neutral-8) 55%, transparent);\n    --o-neutral-a9: color-mix(in oklab, var(--o-neutral-9) 100%, transparent);\n    --o-neutral-a10: color-mix(in oklab, var(--o-neutral-10) 100%, transparent);\n    --o-neutral-a11: color-mix(in oklab, var(--o-neutral-11) 80%, transparent);\n    --o-neutral-a12: color-mix(in oklab, var(--o-neutral-12) 60%, transparent);\n    --o-neutral-on-9: var(--o-ink-solid-dark);\n\n    /* steel \u2014 hue 232 */\n    --o-steel-1: oklch(0.160 0.0079 232);\n    --o-steel-2: oklch(0.190 0.0132 232);\n    --o-steel-3: oklch(0.220 0.0211 232);\n    --o-steel-4: oklch(0.250 0.0290 232);\n    --o-steel-5: oklch(0.280 0.0396 232);\n    --o-steel-6: oklch(0.310 0.0501 232);\n    --o-steel-7: oklch(0.365 0.0660 232);\n    --o-steel-8: oklch(0.435 0.0871 232);\n    --o-steel-9: oklch(0.620 0.1319 232);\n    --o-steel-10: oklch(0.665 0.1293 232);\n    --o-steel-11: oklch(0.760 0.0950 232);\n    --o-steel-12: oklch(0.955 0.0554 232);\n    --o-steel-a1: color-mix(in oklab, var(--o-steel-1) 4%, transparent);\n    --o-steel-a2: color-mix(in oklab, var(--o-steel-2) 8%, transparent);\n    --o-steel-a3: color-mix(in oklab, var(--o-steel-3) 12%, transparent);\n    --o-steel-a4: color-mix(in oklab, var(--o-steel-4) 16%, transparent);\n    --o-steel-a5: color-mix(in oklab, var(--o-steel-5) 22%, transparent);\n    --o-steel-a6: color-mix(in oklab, var(--o-steel-6) 30%, transparent);\n    --o-steel-a7: color-mix(in oklab, var(--o-steel-7) 40%, transparent);\n    --o-steel-a8: color-mix(in oklab, var(--o-steel-8) 55%, transparent);\n    --o-steel-a9: color-mix(in oklab, var(--o-steel-9) 100%, transparent);\n    --o-steel-a10: color-mix(in oklab, var(--o-steel-10) 100%, transparent);\n    --o-steel-a11: color-mix(in oklab, var(--o-steel-11) 80%, transparent);\n    --o-steel-a12: color-mix(in oklab, var(--o-steel-12) 60%, transparent);\n    --o-steel-on-9: var(--o-ink-solid-dark);\n\n    /* amber \u2014 hue 75 */\n    --o-amber-1: oklch(0.160 0.0074 75);\n    --o-amber-2: oklch(0.190 0.0123 75);\n    --o-amber-3: oklch(0.220 0.0197 75);\n    --o-amber-4: oklch(0.250 0.0270 75);\n    --o-amber-5: oklch(0.280 0.0369 75);\n    --o-amber-6: oklch(0.310 0.0467 75);\n    --o-amber-7: oklch(0.365 0.0614 75);\n    --o-amber-8: oklch(0.435 0.0811 75);\n    --o-amber-9: oklch(0.700 0.1229 75);\n    --o-amber-10: oklch(0.745 0.1204 75);\n    --o-amber-11: oklch(0.760 0.0885 75);\n    --o-amber-12: oklch(0.955 0.0516 75);\n    --o-amber-a1: color-mix(in oklab, var(--o-amber-1) 4%, transparent);\n    --o-amber-a2: color-mix(in oklab, var(--o-amber-2) 8%, transparent);\n    --o-amber-a3: color-mix(in oklab, var(--o-amber-3) 12%, transparent);\n    --o-amber-a4: color-mix(in oklab, var(--o-amber-4) 16%, transparent);\n    --o-amber-a5: color-mix(in oklab, var(--o-amber-5) 22%, transparent);\n    --o-amber-a6: color-mix(in oklab, var(--o-amber-6) 30%, transparent);\n    --o-amber-a7: color-mix(in oklab, var(--o-amber-7) 40%, transparent);\n    --o-amber-a8: color-mix(in oklab, var(--o-amber-8) 55%, transparent);\n    --o-amber-a9: color-mix(in oklab, var(--o-amber-9) 100%, transparent);\n    --o-amber-a10: color-mix(in oklab, var(--o-amber-10) 100%, transparent);\n    --o-amber-a11: color-mix(in oklab, var(--o-amber-11) 80%, transparent);\n    --o-amber-a12: color-mix(in oklab, var(--o-amber-12) 60%, transparent);\n    --o-amber-on-9: var(--o-ink-solid-dark);\n\n    /* ember \u2014 hue 45 */\n    --o-ember-1: oklch(0.160 0.0090 45);\n    --o-ember-2: oklch(0.190 0.0150 45);\n    --o-ember-3: oklch(0.220 0.0240 45);\n    --o-ember-4: oklch(0.250 0.0330 45);\n    --o-ember-5: oklch(0.280 0.0450 45);\n    --o-ember-6: oklch(0.310 0.0571 45);\n    --o-ember-7: oklch(0.365 0.0751 45);\n    --o-ember-8: oklch(0.435 0.0991 45);\n    --o-ember-9: oklch(0.630 0.1502 45);\n    --o-ember-10: oklch(0.675 0.1471 45);\n    --o-ember-11: oklch(0.760 0.1081 45);\n    --o-ember-12: oklch(0.955 0.0631 45);\n    --o-ember-a1: color-mix(in oklab, var(--o-ember-1) 4%, transparent);\n    --o-ember-a2: color-mix(in oklab, var(--o-ember-2) 8%, transparent);\n    --o-ember-a3: color-mix(in oklab, var(--o-ember-3) 12%, transparent);\n    --o-ember-a4: color-mix(in oklab, var(--o-ember-4) 16%, transparent);\n    --o-ember-a5: color-mix(in oklab, var(--o-ember-5) 22%, transparent);\n    --o-ember-a6: color-mix(in oklab, var(--o-ember-6) 30%, transparent);\n    --o-ember-a7: color-mix(in oklab, var(--o-ember-7) 40%, transparent);\n    --o-ember-a8: color-mix(in oklab, var(--o-ember-8) 55%, transparent);\n    --o-ember-a9: color-mix(in oklab, var(--o-ember-9) 100%, transparent);\n    --o-ember-a10: color-mix(in oklab, var(--o-ember-10) 100%, transparent);\n    --o-ember-a11: color-mix(in oklab, var(--o-ember-11) 80%, transparent);\n    --o-ember-a12: color-mix(in oklab, var(--o-ember-12) 60%, transparent);\n    --o-ember-on-9: var(--o-ink-solid-dark);\n\n    /* signal \u2014 hue 25 */\n    --o-signal-1: oklch(0.160 0.0107 25);\n    --o-signal-2: oklch(0.190 0.0178 25);\n    --o-signal-3: oklch(0.220 0.0285 25);\n    --o-signal-4: oklch(0.250 0.0392 25);\n    --o-signal-5: oklch(0.280 0.0535 25);\n    --o-signal-6: oklch(0.310 0.0678 25);\n    --o-signal-7: oklch(0.365 0.0892 25);\n    --o-signal-8: oklch(0.435 0.1177 25);\n    --o-signal-9: oklch(0.560 0.1784 25);\n    --o-signal-10: oklch(0.605 0.1748 25);\n    --o-signal-11: oklch(0.760 0.1284 25);\n    --o-signal-12: oklch(0.955 0.0749 25);\n    --o-signal-a1: color-mix(in oklab, var(--o-signal-1) 4%, transparent);\n    --o-signal-a2: color-mix(in oklab, var(--o-signal-2) 8%, transparent);\n    --o-signal-a3: color-mix(in oklab, var(--o-signal-3) 12%, transparent);\n    --o-signal-a4: color-mix(in oklab, var(--o-signal-4) 16%, transparent);\n    --o-signal-a5: color-mix(in oklab, var(--o-signal-5) 22%, transparent);\n    --o-signal-a6: color-mix(in oklab, var(--o-signal-6) 30%, transparent);\n    --o-signal-a7: color-mix(in oklab, var(--o-signal-7) 40%, transparent);\n    --o-signal-a8: color-mix(in oklab, var(--o-signal-8) 55%, transparent);\n    --o-signal-a9: color-mix(in oklab, var(--o-signal-9) 100%, transparent);\n    --o-signal-a10: color-mix(in oklab, var(--o-signal-10) 100%, transparent);\n    --o-signal-a11: color-mix(in oklab, var(--o-signal-11) 80%, transparent);\n    --o-signal-a12: color-mix(in oklab, var(--o-signal-12) 60%, transparent);\n    --o-signal-on-9: var(--o-ink-solid-light);\n\n    /* verdant \u2014 hue 152 */\n    --o-verdant-1: oklch(0.160 0.0074 152);\n    --o-verdant-2: oklch(0.190 0.0123 152);\n    --o-verdant-3: oklch(0.220 0.0197 152);\n    --o-verdant-4: oklch(0.250 0.0270 152);\n    --o-verdant-5: oklch(0.280 0.0369 152);\n    --o-verdant-6: oklch(0.310 0.0467 152);\n    --o-verdant-7: oklch(0.365 0.0614 152);\n    --o-verdant-8: oklch(0.435 0.0811 152);\n    --o-verdant-9: oklch(0.620 0.1229 152);\n    --o-verdant-10: oklch(0.665 0.1204 152);\n    --o-verdant-11: oklch(0.760 0.0885 152);\n    --o-verdant-12: oklch(0.955 0.0516 152);\n    --o-verdant-a1: color-mix(in oklab, var(--o-verdant-1) 4%, transparent);\n    --o-verdant-a2: color-mix(in oklab, var(--o-verdant-2) 8%, transparent);\n    --o-verdant-a3: color-mix(in oklab, var(--o-verdant-3) 12%, transparent);\n    --o-verdant-a4: color-mix(in oklab, var(--o-verdant-4) 16%, transparent);\n    --o-verdant-a5: color-mix(in oklab, var(--o-verdant-5) 22%, transparent);\n    --o-verdant-a6: color-mix(in oklab, var(--o-verdant-6) 30%, transparent);\n    --o-verdant-a7: color-mix(in oklab, var(--o-verdant-7) 40%, transparent);\n    --o-verdant-a8: color-mix(in oklab, var(--o-verdant-8) 55%, transparent);\n    --o-verdant-a9: color-mix(in oklab, var(--o-verdant-9) 100%, transparent);\n    --o-verdant-a10: color-mix(in oklab, var(--o-verdant-10) 100%, transparent);\n    --o-verdant-a11: color-mix(in oklab, var(--o-verdant-11) 80%, transparent);\n    --o-verdant-a12: color-mix(in oklab, var(--o-verdant-12) 60%, transparent);\n    --o-verdant-on-9: var(--o-ink-solid-dark);\n\n    /* -------------------------------------------------------------------------\n       Bevel, re-derived for a dark ground.\n\n       These MUST be restated per theme, and the reason is geometric rather than\n       chromatic. In light, a card is lifted by pooling white INSIDE its lower\n       edge -- white on white reads as a soft interior lift. Do the same thing on\n       a dark card and you get a lamp. The dark equivalent of \"lifted\" is a\n       lighter surface, a hairline of light caught on the TOP edge, and a shadow\n       that is actually dark. Different shapes, not the same shape recoloured, so\n       one shared recipe with swapped colours cannot express both.\n\n       Leaving them undefined here was a real, shipped bug: every shadow is mixed\n       from --o-neutral-12, which is near-black in light and near-white in dark,\n       so every shadow in the product inverted into a glow, and --o-bevel-raised\n       carried a 100%-opacity white inset that turned every card into a halo.\n\n       Shadows are mixed from black rather than from an ink token on purpose: a\n       shadow is an absence of light, and it must not follow the text colour when\n       the theme flips. That coupling is what broke.\n       ---------------------------------------------------------------------- */\n    --o-bevel-control:\n      inset 0 1px 0 0 color-mix(in oklab, white 8%, transparent),\n      0 1px 2px -0.5px color-mix(in oklab, black 55%, transparent);\n    --o-bevel-control-solid:\n      0 1px 8px -3px color-mix(in oklab, black 70%, transparent),\n      inset 0.5px 0 0 0 color-mix(in oklab, black 40%, transparent),\n      inset -0.5px 0 0 0 color-mix(in oklab, black 40%, transparent),\n      inset 0 1.25px 0 -0.5px color-mix(in oklab, white 14%, transparent),\n      inset 0 -1.25px 0 -0.5px color-mix(in oklab, white 8%, transparent);\n    --o-bevel-raised:\n      inset 0 0.5px 0.25px 0 color-mix(in oklab, white 10%, transparent),\n      inset 0 -0.5px 0.25px 0 color-mix(in oklab, black 50%, transparent),\n      inset 0 2px 4px 0 color-mix(in oklab, white 4%, transparent),\n      0 5px 12px -10px color-mix(in oklab, black 75%, transparent);\n    --o-bevel-resting:\n      inset 0 0.5px 0.25px 0 color-mix(in oklab, white 6%, transparent),\n      inset 0 -0.5px 0.25px 0 color-mix(in oklab, black 40%, transparent),\n      0 4px 10px -8px color-mix(in oklab, black 60%, transparent);\n    --o-bevel-inset:\n      inset 0 -2.5px 15px 0 color-mix(in oklab, black 24%, transparent),\n      inset 0 2.5px 15px 0 color-mix(in oklab, black 24%, transparent);\n    /* The rim inverts, and only in dark: light collects on the top edge and the\n       bottom edge falls into shadow. In light both edges are ink. */\n    --o-bevel-rim:\n      inset 0 0.5px 0.25px 0 color-mix(in oklab, white 9%, transparent),\n      inset 0 -0.5px 0.25px 0 color-mix(in oklab, black 45%, transparent);\n}\n\n/* =============================================================================\n   Tier 2 \u2014 semantic. The only tier components consume.\n   ============================================================================= */\n\n:root, :root[data-theme='dark'] {\n  /* THE STRUCTURAL INVERSION, and the single biggest visual decision here.\n     The ground is GREY and surfaces are WHITE floating on it \u2014 the opposite of\n     the usual white-page-with-grey-panels. It is what makes the reference feel\n     calm and dimensional rather than flat, and it costs nothing: the same ramp,\n     read from a different step.\n\n     WHICH step is not theme-portable, and that is the subtle part. The invariant\n     is \"a raised surface is LIGHTER than the ground it floats on\". In light that\n     means the ground is step 3 and the surface is step 1, because step 1 is the\n     lightest. In dark the ramp runs the other way \u2014 step 1 is the DARKEST \u2014 so\n     these same two mappings put every card BELOW its own ground: a hole punched\n     into the canvas rather than a surface floating on it. The dark override\n     below swaps them, and `elevation is monotonic` in tokens.test.ts is what\n     stops this being rediscovered by looking at a screenshot. */\n  --bg-canvas: var(--o-neutral-3);\n  --bg-raised: var(--o-neutral-1);\n  --bg-subtle: var(--o-neutral-2);\n  --bg-component: var(--o-neutral-4);\n  --bg-hover: var(--o-neutral-5);\n  --bg-active: var(--o-neutral-6);\n\n  --line-rule: var(--o-neutral-a6);\n  --line-border: var(--o-neutral-a7);\n  --line-strong: var(--o-neutral-a8);\n  /* A border that IDENTIFIES a control, not a decorative rule. Steps 6-8 are\n     hairlines for table rules and dividers and legitimately sit below WCAG\n     1.4.11's 3:1 \u2014 at step 7 a control border is 1.5:1 on canvas, which is not\n     a boundary anyone can see. Control boundaries bind here instead. */\n  --line-control: var(--o-neutral-10);\n\n  --fg-primary: var(--o-neutral-12);\n  --fg-secondary: var(--o-neutral-11);\n  --fg-on-solid: var(--o-neutral-on-9);\n\n  --control-solid-top: var(--o-slab-top);\n  /* Anything setting `color` on a control-solid fill MUST use this and never\n     --fg-on-solid. The two are different inks for different fills. */\n  --control-solid-ink: var(--o-slab-ink);\n  --control-solid-bottom: var(--o-slab-bottom);\n\n  --accent-solid: var(--o-steel-9);\n  --accent-hover: var(--o-steel-10);\n  --accent-line: var(--o-steel-a8);\n  /* The accent as INK. Same trap as risk: step 9 is a fill anchor and is only\n     3.6:1 as text on canvas. Links and inline accents bind here. */\n  --accent-text: var(--o-steel-11);\n  --accent-on-solid: var(--o-steel-on-9);\n  /* The ring is INK, not a fill, and binding it to step 9 was the same mistake\n     --accent-text and the risk text steps already exist to correct.\n\n     A focus indicator is judged against what it is ADJACENT to (WCAG 1.4.11,\n     3:1), and with `outline-offset` the adjacent colour is whatever the control\n     sits on. Step 9 is theme-invariant in lightness by design, so one value had\n     to answer for light grounds at L 0.89-1.00 and dark grounds at L 0.16-0.31.\n     It could only be right for one of them, and it was: measured across steps\n     1-6 it ran 3.47 down to 2.48:1 in light, failing on --bg-component,\n     --bg-hover and --bg-active. --bg-component is the button's own background,\n     so the indicator on the most common control in the product was 2.86:1.\n\n     Step 11 is theme-aware, so it moves with the ground: worst case 3.72:1 in\n     light and 6.24:1 in dark, across every surface a ring can border. No halo\n     layer is needed, which matters because \xA76.3's box-shadow ring would be\n     clipped by the `overflow: hidden` on every scrollable log panel we own.\n\n     This is the trap-6 fix. The reference removes focus indication entirely;\n     replacing it with an indicator that misses the non-text floor would have\n     been the same defect wearing a fix's clothes. */\n  --focus-ring: var(--o-steel-11);\n\n  /* Risk \u2014 the one family that spends hue. Low is the ABSENCE of hue. */\n  --risk-low-tint: transparent;\n  --risk-low-solid: var(--o-neutral-9);\n  --risk-medium-tint: var(--o-amber-a3);\n  --risk-medium-solid: var(--o-amber-9);\n  --risk-medium-on: var(--o-amber-on-9);\n  --risk-high-tint: var(--o-ember-a3);\n  --risk-high-solid: var(--o-ember-9);\n  --risk-high-on: var(--o-ember-on-9);\n  --risk-critical-tint: var(--o-signal-a3);\n  --risk-critical-solid: var(--o-signal-9);\n  --risk-critical-on: var(--o-signal-on-9);\n\n  /* Risk expressed as INK. Step 9 is a fill anchor at a lightness chosen to\n     carry ink, which makes it far too light to BE ink: amber-9 as text is\n     2.6:1 on canvas. Step 11 is the text step and meets 4.5:1. Grafana splits\n     redDarkMain from redDarkText for the same reason. */\n  --risk-medium-text: var(--o-amber-11);\n  --risk-high-text: var(--o-ember-11);\n  --risk-critical-text: var(--o-signal-11);\n\n  --verified-solid: var(--o-verdant-9);\n  --verified-line: var(--o-verdant-a8);\n  /* The ink partner, for exactly the reason stated above the risk text steps:\n     verdant-9 is a FILL anchor and measures ~2.9:1 as text on canvas, which is\n     below the 4.5:1 floor. Anything setting `color` from a verified signal must\n     use this and never the solid. */\n  --verified-text: var(--o-verdant-11);\n  /* And the ink that sits ON the solid, so a filled success chip is a token\n     lookup rather than a judgement call. */\n  --verified-on: var(--o-verdant-on-9);\n\n  /* Autonomy \u2014 container edge. Line STYLE is the channel; nothing else uses it. */\n  --autonomy-rail-width: 3px;\n  --autonomy-autonomous-style: solid;\n  --autonomy-approval-style: dashed;\n  --autonomy-restricted-style: double;\n  --autonomy-forbidden-style: solid;\n  --autonomy-autonomous-color: var(--o-neutral-a8);\n  --autonomy-approval-color: var(--o-steel-a8);\n  --autonomy-restricted-color: var(--o-amber-a8);\n  --autonomy-forbidden-color: var(--o-signal-a8);\n\n  /* Provenance \u2014 the ground. ONE meaning: not an established fact (\xA70 C). */\n  --provenance-hatch-color: var(--o-neutral-a4);\n  --provenance-hatch: repeating-linear-gradient(\n    45deg,\n    var(--provenance-hatch-color) 0 1px,\n    transparent 1px 7px\n  );\n\n  /* Charts are monochrome by construction (\xA73.7). Colour must be asked for. */\n  --chart-1: var(--o-neutral-12);\n  --chart-2: var(--o-neutral-11);\n  --chart-3: var(--o-neutral-10);\n  --chart-4: var(--o-neutral-9);\n  --chart-5: var(--o-neutral-8);\n  --chart-6: var(--o-neutral-7);\n\n  /* ===========================================================================\n     GLASS \u2014 the one material that is not allowed on the flat ground.\n\n     THE RULE, and it decides everything about this family:\n       Glass only where it floats over a photograph. Opaque white everywhere it\n       sits on the flat ground.\n\n     This is measured, not preferred. Across every marketing page on the\n     reference, the count of elements with a computed `backdrop-filter` is\n     ZERO; its glassiness is inset white rims plus ink hairlines on opaque\n     fills, which is what --o-bevel-* already encodes. Its PRODUCT CSS uses\n     `blur(clamp(14px, .6vw, 44px))` on nearly every floating surface, because\n     there the ground is a photographic wallpaper. Putting blur on a card that\n     sits on our canvas is copying the product onto the site (trap 11).\n\n     Nothing in Orvay's product qualifies today: our ground is flat by\n     decision, so this family is currently reachable only from a surface that\n     declares `data-ground=\"photographic\"`. ui.css owns that gate and\n     tokens.test.ts proves the gate fires. The family is built rather than\n     deferred because the tenant-website preview surface is a real photographic\n     ground arriving later, and a material invented under deadline is how the\n     one rule above gets quietly broken.\n\n     THEME-INVARIANT ON PURPOSE, and this is the part that is easy to get\n     wrong. Every other surface token here inverts, because its ground is our\n     canvas. Glass floats over an arbitrary image that knows nothing about\n     `prefers-color-scheme`. Mixing the scrim from --o-neutral-12 would make it\n     a dark veil in light mode and a near-white veil in dark mode over the same\n     photograph. That is exactly the coupling that broke every shadow in the\n     product once already; the note above --o-bevel-* in the dark block records\n     it. So the scrim is declared once, here, and never restated.\n     ======================================================================== */\n\n  /* The measured ink, restated as a fixed value because it must not follow the\n     theme. Same construction and same reason as --o-ink-solid-light/dark. */\n  --o-glass-scrim: oklch(0.216 0.0075 248);\n  /* #171a1d59 measured \u2014 35% is the value that makes an arbitrary photograph\n     quiet enough to read white ink against without becoming a grey panel. */\n  --o-glass-fill: color-mix(in oklab, var(--o-glass-scrim) 35%, transparent);\n  /* The veil the GROUND wears, and the reason it has to exist.\n\n     The measured scrim is 35%, and at 35% glass ink is legible over the\n     reference's own wallpapers and nowhere else. Measured through the shipped\n     values: white ink on a 35% scrim is 10.27:1 over a mid-dark photograph and\n     2.11:1 over a white one. warmwind never meets the second case because it\n     ships the photographs; Orvay's only plausible photographic surface is a\n     tenant's own imagery, which is uploaded by somebody else and can be\n     anything at all.\n\n     So the ground guarantees its own ceiling rather than trusting its content.\n     0.40 is the minimum veil that clears 4.5:1 against a WHITE photograph;\n     0.45 is what ships, for headroom, and material.test.ts asserts the\n     arithmetic against the worst case rather than against a sample image.\n\n     This is the one place the measurement could not be copied. It was right for\n     the reference's situation and wrong for ours, and the difference is who\n     supplies the picture. */\n  --o-ground-veil: color-mix(in oklab, var(--o-glass-scrim) 45%, transparent);\n  --o-glass-blur: blur(clamp(14px, 0.6vw, 44px));\n  /* The modal scrim, which belongs to this family only because it shares the\n     fixed ink. Measured as a FLAT 60% scrim with no blur: the reference's own\n     dialog backdrop is flat, and blurring the page behind a modal is the same\n     trap-11 mistake as blurring a card on the flat ground. Theme-invariant,\n     because darkening the page is the same gesture in either theme. */\n  --o-scrim: color-mix(in oklab, var(--o-glass-scrim) 60%, transparent);\n  /* One variant on the reference adds saturation, which puts colour back that\n     a heavy blur averages away. Use it on chrome that sits over a photograph\n     the reader is meant to still perceive as a photograph. */\n  --o-glass-blur-vivid: blur(clamp(14px, 0.6vw, 44px)) saturate(1.5);\n\n  /* The rim is what makes a 35% scrim legible against an unknown image, and\n     the bevel is INVERTED on purpose: ink insets on the left and right only,\n     white 30% rims on the top and bottom. That is backwards from a physical\n     bevel, and it is precisely why these read as glass rather than as plastic.\n     Put a dark inset on the bottom and you have built a button (trap 4).\n     Restated here rather than aliased to --o-bevel-control-solid because that\n     token inverts per theme and this one must not. */\n  --o-glass-rim:\n    0 1px 8px -3px color-mix(in oklab, var(--o-glass-scrim) 20%, transparent),\n    inset 0.5px 0 0 0 color-mix(in oklab, var(--o-glass-scrim) 10%, transparent),\n    inset -0.5px 0 0 0 color-mix(in oklab, var(--o-glass-scrim) 10%, transparent),\n    inset 0 1.25px 0 -0.5px color-mix(in oklab, white 30%, transparent),\n    inset 0 -1.25px 0 -0.5px color-mix(in oklab, white 30%, transparent);\n\n  /* Ink on glass is fixed light, for the same reason the scrim is fixed dark. */\n  --o-glass-ink: var(--o-ink-solid-light);\n\n  /* THERE IS NO SECONDARY INK ON GLASS, and the reason is arithmetic.\n\n     Over a white photograph, veiled and scrimmed, primary ink measures 5.06:1.\n     That leaves almost no budget: the minimum alpha that still clears 4.5:1 is\n     0.91, and ink at 91% is not a de-emphasised tier, it is primary ink with a\n     rounding error. Buying a real muted tier means a veil of 0.65, which\n     obscures the photograph badly enough that there was no reason to use one.\n\n     So on glass, de-emphasis is size, tracking and position, never opacity.\n     Same lesson as the weight cap, applied to a different channel: when a\n     channel has no headroom, stop spending in it rather than spending a token\n     amount and calling it hierarchy.\n\n     material.test.ts enumerates every --o-glass-ink* token and holds each to\n     4.5:1 against a white photograph, so adding one later is allowed and being\n     illegible is not. */\n  /* Panels on a photographic ground are separated by the WALLPAPER showing\n     through, never by a divider. There is no line token here on purpose. */\n\n  /* The progressive blur \u2014 ten layers, each doubling, each masked to a 10% band\n     shifted 10% further along. Worth stealing outright: a single large blur\n     reads as a smear, the stack reads as depth, and the difference is entirely\n     in the fact that the transition between blurred and unblurred is itself\n     gradual. The component that assembles the twelve layers is ProgressiveBlur\n     in @orvay/ui; the ladder is owned here so the doubling cannot drift. */\n  --o-blur-l1: 0.1px;\n  --o-blur-l2: 0.2px;\n  --o-blur-l3: 0.4px;\n  --o-blur-l4: 0.8px;\n  --o-blur-l5: 1.6px;\n  --o-blur-l6: 3.2px;\n  --o-blur-l7: 6.4px;\n  --o-blur-l8: 12.8px;\n  --o-blur-l9: 25.6px;\n  --o-blur-l10: 51.2px;\n  --o-blur-band: 10%;\n}\n\n\n/* =============================================================================\n   Tier 2 \u2014 dark. Only the surface ladder moves.\n\n   Everything else in Tier 2 is expressed as a var() onto a Tier 1 step that\n   already flips, so it needs no restatement: --fg-primary is step 12 and step 12\n   is ink in both themes. The BACKGROUNDS are the exception, because \"raised\" is\n   not a step, it is a DIRECTION along the ramp, and the ramp reverses.\n\n   Light: ground 3 (0.955) -> surface 1 (1.000), a lift of +0.045.\n   Dark:  ground 1 (0.160) -> surface 3 (0.220), a lift of +0.060.\n\n   Same gesture, opposite steps. Leaving this out is what made every card in dark\n   sit BELOW its ground; the white halo was a second, independent bug on top of\n   it, and fixing only the halo would have produced something that looked better\n   and was still inverted.\n   ============================================================================= */\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme='light']) {\n    --bg-canvas: var(--o-neutral-1);\n    --bg-subtle: var(--o-neutral-2);\n    --bg-raised: var(--o-neutral-3);\n  }\n}\n:root[data-theme='dark'] {\n  --bg-canvas: var(--o-neutral-1);\n  --bg-subtle: var(--o-neutral-2);\n  --bg-raised: var(--o-neutral-3);\n}\n\n/* `color-scheme`, pinned to the explicit choice.\n   Declared HERE rather than beside the bare `:root` declaration at the top of\n   the file, because tokens.test.ts slices this document into theme blocks by\n   the FIRST occurrence of each selector and asserts they appear in ramp order.\n   A `[data-theme='dark']` rule above the ramps makes that slice start in the\n   wrong place and every dark-theme assertion in the suite silently measures the\n   light values. The suite caught it; the placement below keeps it honest. */\n:root[data-theme='light'] { color-scheme: light; }\n:root[data-theme='dark'] { color-scheme: dark; }\n\n/* =============================================================================\n   Print under a dark theme.\n\n   `--bg-canvas: #ffffff` alone was not enough, and for this product that is a\n   critical bug rather than a cosmetic one: a reader in dark mode printing an\n   evidence exhibit got near-white ink (step 12 = 0.955) on a forced-white page.\n   The exhibit prints blank. CLAUDE.md section 7 says a printed simulated run\n   that looks live is a critical bug; a printed run that shows nothing at all is\n   the same class of failure.\n\n   The neutral ramp is restated at its LIGHT values for print, rather than only\n   the ground, because ink and ground have to agree about which way the ramp\n   runs. Only the steps that carry ground, surface and ink are listed; the risk\n   hues keep their own values and are already forced with print-color-adjust.\n   ============================================================================= */\n@media print {\n  :root, :root[data-theme='dark'], :root:not([data-theme='light']) {\n    --o-neutral-1: oklch(1.000 0.0000 250);\n    --o-neutral-2: oklch(0.978 0.0010 250);\n    --o-neutral-3: oklch(0.955 0.0000 250);\n    /* Mirrors the light value exactly. It had drifted to L 0.528 / C 0.0090\n       against light's 0.500 / 0.0055, which is a third ramp nobody chose: the\n       block's whole purpose is to restate the LIGHT ramp so a dark-mode reader\n       printing an exhibit gets ink on paper. A print-only value that agrees\n       with neither theme is how an exhibit stops matching the screen it was\n       taken from. tokens.test.ts now asserts the mirroring. */\n    --o-neutral-11: oklch(0.485 0.0055 250);\n    --o-neutral-12: oklch(0.216 0.0075 248);\n    --bg-canvas: var(--o-neutral-3);\n    --bg-subtle: var(--o-neutral-2);\n    --bg-raised: var(--o-neutral-1);\n  }\n}\n\n/* =============================================================================\n   Print \u2014 a first-class output (\xA70 E).\n\n   Screenshots of Orvay are exhibits. Browsers strip backgrounds by default,\n   which would remove the risk tint AND the provenance hatch, so a printed\n   SIMULATED run would look live. That is the one thing this product must never\n   do. Colour is forced, and the redundant text carriers do the rest.\n   ============================================================================= */\n@media print {\n  :root { --bg-canvas: #ffffff; }\n  [data-provenance], [data-risk] {\n    print-color-adjust: exact;\n    -webkit-print-color-adjust: exact;\n  }\n}\n\n/* =============================================================================\n   Reduced motion \u2014 stand the movement down, never the signal.\n\n   This is trap 19, and it is law here rather than taste (CLAUDE.md \xA77a). The\n   reference ships `*, ::before, ::after { animation-duration: .001ms }`, which\n   DELETES its pulsing .ActiveIndicator. That indicator is the only thing on the\n   screen saying a worker is alive, and nothing takes its place. A reader who\n   sets a motion preference is asking not to be moved; they are not asking to be\n   told less.\n\n   So the rule for this repository is stated as an obligation on the AUTHOR of a\n   motion, not on this block: any motion that carries meaning must have a\n   non-motion carrier that survives here. The theme toggle's glyph swap is one\n   (the sun still becomes a moon with the travel at zero); the stale-run signal\n   in ui.css is the other, and it degrades to a static hatch plus the literal\n   word rather than to a still dot.\n\n   Every duration is listed, including the aliases. Relying on an alias to\n   inherit its target's zero would work today and break silently the moment\n   somebody gives the alias its own value, and this block is the single control\n   that must not have an escape hatch. tokens.test.ts asserts the list is\n   complete against the tokens actually declared above.\n   ============================================================================= */\n@media (prefers-reduced-motion: reduce) {\n  :root {\n    --o-dur-instant: 0ms;\n    --o-dur-quick: 0ms;\n    --o-dur-considered: 0ms;\n    --o-dur-enter: 0ms;\n    --o-dur-exit: 0ms;\n    --o-dur-reveal: 0ms;\n    --o-stagger-unit: 0ms;\n    /* The travel and the blur are stood down too. A 0ms transition on a 4px\n       translate still paints the element 4px out of place on the first frame\n       if the travel itself survives, and an enter blur with no duration is a\n       permanently blurred element. */\n    --o-travel-reveal: 0px;\n    --o-blur-enter: 0px;\n  }\n}\n";

// ../../packages/domain/src/ids.ts
var make = () => (value) => value;
var OrganizationId = make();
var CompanyId = make();
var MemberId = make();
var DepartmentId = make();
var AgentId = make();
var GoalId = make();
var InitiativeId = make();
var SignalId = make();
var ActionContractId = make();
var ApprovalId = make();
var RunId = make();
var EvidenceId = make();
var IntegrationId = make();
var TraceId = make();
var IdempotencyKey = make();
var Sha256 = make();
var Instant = (ms) => ms;

// ../../packages/domain/src/capability.ts
var CHANNELS = ["email", "voice", "sms"];
var RESERVED_RESOURCE_PREFIXES = ["communicate", ...CHANNELS].map(
  (segment) => `${segment}.`
);

// ../../packages/routes/src/index.ts
var HOSTS = {
  site: "https://orvayos.com",
  app: "https://app.orvayos.com",
  docs: "https://docs.orvayos.com",
  /**
   * Where a customer builds their website.
   *
   * On OUR domain, not on `orvay.app`, and the reason is worth stating because
   * the opposite looks tidier. The studio is an authenticated surface holding a
   * session cookie. Putting it on `orvay.app` would place it on the same
   * registrable domain as the tenant sites, and until the Public Suffix List
   * entry is live any tenant site can set a cookie with `Domain=orvay.app` that
   * the studio would then receive. Untrusted, model-authored content sharing a
   * cookie domain with an authenticated console is the one arrangement this
   * whole design exists to prevent.
   *
   * The live preview is an iframe pointing at `orvay.app`, so model-authored
   * code is cross-origin from this host at every stage, not merely after
   * publish.
   *
   * HANDOVER, S5 -> S6 (docs/plan/handoffs.md): S6 owns this package. This key
   * is added by S5 because `pnpm session` refuses to cut S6 until S5 has
   * merged, so this is a sequencing handover rather than shared ownership, the
   * same shape as the S1 -> S7 `wrangler.jsonc` handover the session plan
   * already blesses for exactly that reason.
   */
  studio: "https://studio.orvayos.com",
  /** Tenant artifacts only. Never Orvay's own content. */
  tenants: "https://orvay.app",
  /**
   * The public status page. THE ONLY HOST HERE NOT SERVED BY US.
   *
   * A subdomain of ours, deliberately pointed at GitHub Pages through a DNS-ONLY
   * record, so a Cloudflare Workers, KV, R2 or edge failure cannot take down the
   * page that reports it. Cloudflare does the same for itself:
   * `cloudflarestatus.com` answers `server: Google Frontend` and delegates to
   * `googledomains.com` nameservers.
   *
   * The record must stay grey cloud. Proxied, the request crosses Cloudflare's
   * edge on its way to Fastly and the page dies in the exact incident it was
   * moved to survive, with nothing anywhere able to detect the mistake: from a
   * browser, from the build and from every probe, a proxied record is
   * indistinguishable from a direct one. ADR-0023.
   */
  status: "https://status.orvayos.com"
};
var FORM_ORIGINS = [
  HOSTS.site,
  "https://www.orvayos.com",
  HOSTS.app,
  "http://localhost:3000",
  "http://localhost:3001"
];
var LOGIN_PATH = "/login";

// ../../packages/status/src/reading.ts
var LEVEL_ORDER = [
  "operational",
  "degraded",
  "partial-outage",
  "major-outage"
];
var levelRank = (level) => LEVEL_ORDER.indexOf(level);
var worstLevel = (levels) => levels.reduce(
  (worst, level) => worst === void 0 || levelRank(level) > levelRank(worst) ? level : worst,
  void 0
);
var isStale = (observedAt, now, budget) => now - observedAt > budget.staleAfterMs;
var displayFor = (reading, now, budget) => {
  switch (reading.method) {
    case "not-measured":
      return { kind: "not-measured", why: reading.why };
    case "vendor-reported":
      return {
        kind: "vendor",
        vendor: reading.vendor,
        state: reading.state,
        vendorUpdatedAt: reading.vendorUpdatedAt,
        fetchedAt: reading.fetchedAt,
        permalink: reading.permalink,
        // Absent counts as stale. A feed that will not say when it last changed
        // has not given us the thing that would make its state believable.
        feedStale: reading.vendorUpdatedAt === void 0 || isStale(reading.vendorUpdatedAt, now, budget)
      };
    case "probe":
    case "telemetry": {
      const { method, vantage, observedAt, observation } = reading;
      if (isStale(observedAt, now, budget)) {
        return { kind: "unknown", reason: "stale", method, vantage, observedAt };
      }
      if (observation.kind === "unknown") {
        return { kind: "unknown", reason: observation.reason, method, vantage, observedAt };
      }
      return {
        kind: "measured",
        level: observation.level,
        method,
        vantage,
        observedAt,
        latencyMs: observation.latencyMs,
        sampleCount: reading.method === "telemetry" ? reading.sampleCount : void 0
      };
    }
  }
};
var overallFrom = (displays) => {
  const ours = displays.filter((d) => d.kind !== "vendor");
  const levels = ours.flatMap((d) => d.kind === "measured" ? [d.level] : []);
  const unknown = ours.filter((d) => d.kind === "unknown").length;
  const notMeasured = ours.filter((d) => d.kind === "not-measured").length;
  const level = worstLevel(levels);
  if (level === void 0) return { kind: "unknown", unknown, notMeasured };
  return {
    kind: "known",
    level,
    complete: unknown === 0 && notMeasured === 0,
    measured: levels.length,
    unknown,
    notMeasured
  };
};

// ../../packages/status/src/components.ts
var MINUTE = 60 * 1e3;
var HOUR = 60 * MINUTE;
var COMPONENTS = [
  // -------------------------------------------------------------------------
  // Group A. Measured by us.
  // -------------------------------------------------------------------------
  {
    id: "sign-in",
    group: "measured",
    label: "Sign in",
    summary: "Reaching the login page and starting a session.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  {
    id: "control-plane",
    group: "measured",
    label: "Company control plane",
    summary: "The app where you review approvals, watch runs and read the audit trail. Our check confirms it is serving and that it keeps signed-out visitors out. It cannot confirm what you see once you are signed in.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  {
    id: "website-studio",
    group: "measured",
    label: "Website studio",
    summary: "Describing a website and watching it build.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  {
    id: "tenant-sites",
    group: "measured",
    label: "Published websites",
    summary: "Websites already published on orvay.app, served to your visitors.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  {
    id: "marketing-and-docs",
    group: "measured",
    label: "Public site and documentation",
    summary: "orvayos.com and the documentation.",
    budget: { staleAfterMs: 20 * MINUTE }
  },
  // The six that Phase 1 does not measure. Each says so.
  {
    id: "agent-runs",
    group: "measured",
    label: "Agent runs",
    summary: "Work being proposed and executed by agents.",
    budget: { staleAfterMs: 1 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. Agent run health comes from real customer traffic rather than from an external check, and that measurement is not built."
  },
  {
    id: "independent-verification",
    group: "measured",
    label: "Independent verification",
    summary: "Checking finished work with a second, separate actor. This is a different row from agent runs on purpose: work can still be executing while nothing can be independently verified.",
    budget: { staleAfterMs: 1 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. Verification health comes from real customer traffic rather than from an external check, and that measurement is not built."
  },
  {
    id: "scheduled-work",
    group: "measured",
    label: "Scheduled work",
    summary: "Background work that runs on a timer rather than when you ask for it.",
    budget: { staleAfterMs: 1 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. A timer that stops is silent by nature, so this row needs a check that lives outside our own systems. It is not built."
  },
  {
    id: "evidence-archive",
    group: "measured",
    label: "Evidence archive",
    summary: "The off-site, tamper-evident copy of your audit trail.",
    budget: { staleAfterMs: 4 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. The check is not built."
  },
  {
    id: "email-notifications",
    group: "measured",
    label: "Email notifications",
    summary: "Messages we send you about your own company. Listed separately because a failure here is the one failure you would not otherwise hear about.",
    budget: { staleAfterMs: 4 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. The check is not built."
  },
  {
    id: "checkout-and-billing",
    group: "measured",
    label: "Checkout and billing",
    summary: "Starting a plan, changing a plan, and paying for one.",
    budget: { staleAfterMs: 4 * HOUR },
    notMeasuredWhy: "Nothing watches this yet. Checkout health has to come from real attempts rather than from a test payment, and that measurement is not built."
  },
  // -------------------------------------------------------------------------
  // Group B. Reported by a vendor. Mirrored, never measured.
  // -------------------------------------------------------------------------
  {
    id: "vendor-cloudflare",
    group: "vendor",
    label: "Cloudflare",
    summary: "Runs our application layer and our network.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-supabase",
    group: "vendor",
    label: "Supabase",
    summary: "Runs the database that holds your company data, in Zurich.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-anthropic",
    group: "vendor",
    label: "Anthropic",
    summary: "One of the two model providers Orvay calls.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-openai",
    group: "vendor",
    label: "OpenAI",
    summary: "The second model provider, used for independent verification.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-stripe",
    group: "vendor",
    label: "Stripe",
    summary: "Processes payments.",
    budget: { staleAfterMs: 24 * HOUR }
  },
  {
    id: "vendor-sentry",
    group: "vendor",
    label: "Sentry",
    summary: "Collects our error reports. A problem here affects us, not you.",
    budget: { staleAfterMs: 24 * HOUR }
  }
];

// ../../packages/content/src/legal.ts
var LEGAL_LAST_UPDATED = "2026-08-16";
var CONTROLLER = {
  name: "Valerio Amirani",
  form: "A natural person, and the sole operator of Orvay. There is no company.",
  street: "Wanderstrasse 19",
  postalCode: "4054",
  city: "Basel",
  country: "Switzerland",
  email: "valerio.amirani@zenovay.com",
  /** One sentence, used verbatim wherever the register question comes up. */
  register: "Not entered in any commercial register. A Swiss Kollektivgesellschaft (general partnership) is intended. It has not been formed, so there is no UID and no CHE number to give."
};
var POSTAL_ADDRESS = `${CONTROLLER.street}, ${CONTROLLER.postalCode} ${CONTROLLER.city}, ${CONTROLLER.country}`;
var SUB_PROCESSOR_STATUS_LABEL = {
  in_use: "In use today",
  configured: "Wired, and receiving only where its credential is set",
  not_engaged: "Named in the product, connected to nothing"
};
var PRIVACY_NOTICE = {
  id: "privacy",
  title: "Privacy notice",
  lead: "What we collect, why, where it goes, and what you can make us do about it. Orvay is run by one person, and the public website collects one thing: an email address, if you choose to give us one.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "controller",
      heading: "Who is responsible",
      blocks: [
        {
          kind: "text",
          text: `${CONTROLLER.name} is the controller for the processing described here. He is a natural person and the sole operator of Orvay. There is no company. A Swiss Kollektivgesellschaft is intended and has not been formed, so there is no commercial register entry and no UID number.`
        },
        {
          kind: "pairs",
          items: [
            { term: "Postal address", detail: POSTAL_ADDRESS },
            { term: "Email", detail: CONTROLLER.email }
          ]
        },
        {
          kind: "text",
          text: "Two laws apply at the same time. The Swiss Federal Act on Data Protection (revFADP, in German revDSG), in force since 1 September 2023, applies because we are in Switzerland. Regulation (EU) 2016/679 (GDPR) applies because we offer a service to people in the European Union. Where the two differ, this notice states both."
        },
        {
          kind: "text",
          text: "We hold no certification and we claim none. Not SOC 2, not ISO 27001, and no compliance badge of any kind. What follows is a description of what we actually do, written so that you can check it."
        }
      ]
    },
    {
      id: "collected",
      heading: "What we collect",
      blocks: [
        {
          kind: "text",
          text: "The public website collects one item of personal data, and only if you hand it over: the email address you type into the waitlist form."
        },
        {
          kind: "text",
          text: "Submitting that form writes a consent record. It holds your address in lower case, the exact wording of the consent sentence you were shown, the date and time, a label saying the address came from the waitlist form on our marketing site and has not been confirmed by a reply, and a SHA-256 digest of the address that we use to build your unsubscribe link. That is the whole record."
        },
        {
          kind: "text",
          text: "We do not ask for your name. We set no analytics cookie, run no tracking pixel, and use no third party analytics service on the public website. We do not buy addresses, and we do not enrich yours from any other source."
        },
        {
          kind: "text",
          text: "Cloudflare serves the website, and in doing so processes the technical details of every request, including your IP address. That happens whether or not you fill in the form, because it is how the page reaches you. Request logging is switched on, so those records are retained by Cloudflare under its own retention period."
        },
        {
          kind: "text",
          text: "If you sign in to the product, more is involved: a sign-in identity from the identity provider, and afterwards the records your company creates. This notice will be extended before that processing is anything other than an empty account, and the sub-processor list already names every service that would touch it."
        }
      ]
    },
    {
      id: "purposes",
      heading: "Why we process it, and on what basis",
      blocks: [
        {
          kind: "pairs",
          items: [
            {
              term: "Writing to you when Orvay launches",
              detail: "Your consent. GDPR Art. 6(1)(a), and consent under the revFADP. You gave it by submitting the form under the sentence we showed you, and we store that sentence word for word so the basis can be checked rather than asserted."
            },
            {
              term: "Keeping the record, including after you unsubscribe",
              detail: "Our obligation to be able to demonstrate consent, GDPR Art. 7(1) read with Art. 5(2). A record that we stopped is the only proof that we stopped."
            },
            {
              term: "Serving the website and keeping it available and secure",
              detail: "Our legitimate interest in running a working website, GDPR Art. 6(1)(f). Under the revFADP this processing needs no separate justification, because it does not breach the principles the Act sets out."
            },
            {
              term: "Signing you in, if you create an account",
              detail: "Performance of a contract with you, GDPR Art. 6(1)(b)."
            },
            {
              term: "Doing the work you ask an agent to do",
              detail: "Performance of a contract with you, GDPR Art. 6(1)(b). The text of your request is sent to a model vendor outside Switzerland and outside the EEA. See international transfers."
            }
          ]
        },
        {
          kind: "text",
          text: "There is no other purpose. We do not profile visitors, we do not build advertising audiences, and we sell nothing to anyone."
        }
      ]
    },
    {
      id: "automated",
      heading: "Automated decisions",
      blocks: [
        {
          kind: "text",
          text: "There is no automated decision with a legal or similarly significant effect on a visitor, and no profiling that produces one. Nothing on the public website engages GDPR Art. 22."
        },
        {
          kind: "text",
          text: "Inside the product, agents propose actions. An action with a legal or similarly significant effect on a person requires a recorded human approval before it can run, and the approval is stored as a scoped, bounded record rather than a flag. That record is the evidence of the human involvement."
        }
      ]
    },
    {
      id: "recipients",
      heading: "Who else sees it",
      blocks: [
        {
          kind: "text",
          text: "We use service providers. Each one is named in the sub-processor list, with what it receives, where it processes and the safeguard the transfer rests on."
        },
        {
          kind: "text",
          text: "We disclose personal data to nobody else. If an authority compelled disclosure we would follow the law, and we would tell you unless we were forbidden from telling you."
        }
      ]
    },
    {
      id: "transfers",
      heading: "Where the data goes",
      blocks: [
        {
          kind: "text",
          text: "Switzerland is not in the European Union and not in the European Economic Area. It is a third country holding an adequacy decision from the European Commission, and one from the United Kingdom. A transfer from the EEA or the UK to us therefore rests on adequacy and needs no further instrument."
        },
        {
          kind: "pairs",
          items: [
            {
              term: "Waitlist addresses, and every other database record",
              detail: "Stored in PostgreSQL in Zurich, Switzerland, in a project whose region is eu-central-2. Safeguard: the EU adequacy decision for Switzerland."
            },
            {
              term: "Evidence artifacts",
              detail: "Stored in an object storage bucket pinned to the EU jurisdiction, so those objects stay on EU infrastructure. Safeguard: the jurisdiction setting, plus the standard contractual clauses in the provider agreement."
            },
            {
              term: "Generated tenant websites, and the page cache",
              detail: "Stored in buckets created with a European location hint. A hint is a preference and not a guarantee, so we do not describe these as jurisdiction bound. Safeguard: the standard contractual clauses in the provider agreement."
            },
            {
              term: "Handling the request itself",
              detail: "Our code runs at the network edge, worldwide, so the request that renders a page may execute close to you rather than in Europe. Safeguard: the standard contractual clauses in the provider agreement."
            },
            {
              term: "Model prompts",
              detail: "Text sent to Anthropic and to OpenAI is processed in the United States, outside Switzerland and outside the EEA. Safeguard: the standard contractual clauses in each vendor agreement. Your waitlist address is never part of that text."
            }
          ]
        },
        {
          kind: "text",
          text: "Ask us which instrument a given provider relies on and we will send you what that provider publishes."
        }
      ]
    },
    {
      id: "retention",
      heading: "How long we keep it",
      blocks: [
        {
          kind: "text",
          text: "The consent ledger is append only. Each record is chained to the one before it by a hash, so removing a row would destroy the proof that the remaining rows are unmodified. Unsubscribing therefore writes a revocation onto your record instead of erasing it."
        },
        {
          kind: "text",
          text: "So the honest answer is this. We keep a waitlist record until you ask us to erase it, and there is no automatic expiry. No plan we sell carries a retention window, because nothing in the product enforces one yet. We would rather publish no number than a number nothing keeps."
        },
        {
          kind: "text",
          text: "Erasure is handled by hand. There is no self-service delete button. Write to us, we will do it, and we will tell you when it is done."
        }
      ]
    },
    {
      id: "rights",
      heading: "Your rights, and how to use them",
      blocks: [
        {
          kind: "text",
          text: `Every right below is exercised the same way. Email ${CONTROLLER.email} from the address you want us to act on, or tell us which address it concerns. We answer within 30 days, and it costs nothing.`
        },
        {
          kind: "pairs",
          items: [
            {
              term: "Access",
              detail: "Ask what we hold about you and we will send it. GDPR Art. 15, revFADP Art. 25."
            },
            {
              term: "Rectification",
              detail: "Tell us what is wrong and we will correct it. GDPR Art. 16, revFADP Art. 32."
            },
            {
              term: "Erasure",
              detail: "Ask us to delete your data and we will. GDPR Art. 17. Where the audit chain prevents removing a record, we destroy the personal data inside it and leave the remainder, which can still show that something happened and can no longer show what it said. The operator does this by hand."
            },
            {
              term: "Restriction",
              detail: "Ask us to stop processing while something is disputed and we will. GDPR Art. 18."
            },
            {
              term: "Portability",
              detail: "Ask for your data in a machine readable file and we will send it. GDPR Art. 20, revFADP Art. 28. This is a right, so it is free and it is available on every plan including the free one. We will never charge for it."
            },
            {
              term: "Objection",
              detail: "Object to processing we base on a legitimate interest, and we stop unless we can show grounds that override yours. GDPR Art. 21."
            },
            {
              term: "Withdrawing consent",
              detail: "Use the unsubscribe link in any message we send, or write to us. Withdrawal takes effect at once, and it does not make the processing before it unlawful. GDPR Art. 7(3)."
            }
          ]
        },
        {
          kind: "text",
          text: "An unsubscribe writes a revocation into the consent ledger. It does not merely flip a switch in a mailing tool, because an unsubscribe that leaves the consent standing is a lie told twice."
        }
      ]
    },
    {
      id: "complaints",
      heading: "Complaining about us",
      blocks: [
        {
          kind: "text",
          text: "You can complain to a supervisory authority, and you do not have to talk to us first. There are separate routes, and you may use whichever applies to you."
        },
        {
          kind: "pairs",
          items: [
            {
              term: "Switzerland",
              detail: "Federal Data Protection and Information Commissioner (FDPIC, in German EDOEB), Feldeggweg 1, 3003 Bern, Switzerland."
            },
            {
              term: "European Union",
              detail: "Your local supervisory authority: the one where you live, the one where you work, or the one where the problem happened. Each member state names its own, and any of the three may take your complaint."
            },
            {
              term: "United Kingdom",
              detail: "The Information Commissioner's Office."
            }
          ]
        }
      ]
    },
    {
      id: "eu-representative",
      heading: "Our EU representative, which we do not have yet",
      blocks: [
        {
          kind: "text",
          text: "GDPR Art. 27 requires a controller established outside the European Union that offers services to people inside it to appoint a representative in the Union. We are established in Switzerland, we offer a waitlist to people in the Union, and we have not appointed one. We are arranging it."
        },
        {
          kind: "text",
          text: "That sentence is on this page rather than left out. A privacy notice that says nothing about Art. 27 reads as though the duty did not exist. Until the appointment is made, writing to the address at the top of this page reaches the controller directly."
        },
        {
          kind: "text",
          text: "The mirror duty does not apply to us. Art. 14 revFADP requires a representative in Switzerland only from controllers domiciled abroad, and we are domiciled here."
        }
      ]
    },
    {
      id: "required",
      heading: "Whether you have to give us anything",
      blocks: [
        {
          kind: "text",
          text: "No. Nothing on the public website requires personal data. The waitlist form is the only place that asks for any, and the only consequence of leaving it empty is that we will not write to you when Orvay launches. There is no contract you fail to enter and no service you lose."
        }
      ]
    },
    {
      id: "security",
      heading: "How it is protected",
      blocks: [
        {
          kind: "list",
          items: [
            "The database is in Zurich, and the operator is the only person with credentials for it.",
            "Tenant data is isolated in the database by RESTRICTIVE row level security, so a query cannot see the rows of another company even if the application asks for them.",
            "The tenant identity is set inside the transaction and never on the connection, so a pooled connection cannot carry the scope of one tenant into the query of the next.",
            "The audit trail is append only and hash chained. A changed record is detectable rather than merely discouraged.",
            "The consent ledger grants the application no delete, and the stored wording of a consent cannot be rewritten.",
            "Session cookies are httpOnly and Secure.",
            "Secrets are held as deployment secrets. None of them are in the source code.",
            "The public marketing site holds no database binding at all, so no marketing page has a path to tenant data.",
            "Our providers encrypt data at rest and in transit as part of their own service."
          ]
        },
        {
          kind: "text",
          text: "We claim nothing beyond that. There is no penetration test report, no certification, and one person with access."
        }
      ]
    },
    {
      id: "changes",
      heading: "Changes to this notice",
      blocks: [
        {
          kind: "text",
          text: "The date at the top is when this text last changed. If a change affects what we do with data you have already given us, we will write to you at the address we hold before it takes effect. Otherwise the new version simply replaces this one."
        }
      ]
    }
  ]
};
var TERMS_OF_SERVICE = {
  id: "terms",
  title: "Terms of service",
  lead: "The agreement between you and the person who runs Orvay. It is short because the product is pre-launch and there is not much to agree about yet.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "parties",
      heading: "Who this is with",
      blocks: [
        {
          kind: "text",
          text: `This agreement is between you and ${CONTROLLER.name}, a natural person operating Orvay from ${POSTAL_ADDRESS}. There is no company. A Swiss Kollektivgesellschaft is intended and has not been formed. If it is formed, this agreement transfers to it, and we will tell you before that happens.`
        },
        {
          kind: "text",
          text: "Using our websites, joining the waitlist, or using the product means you accept these terms. If you do not accept them, do not use the service."
        },
        { kind: "hosts" }
      ]
    },
    {
      id: "service",
      heading: "What the service is",
      blocks: [
        {
          kind: "text",
          text: "Orvay is an operating system for running a company with AI agents. A company gives it goals, context, integrations, permissions and budgets. Orvay proposes work, gets it approved where approval is required, executes it, has the result verified by something other than the thing that did the work, and keeps an auditable record."
        },
        {
          kind: "text",
          text: "It is not a chatbot and it is not a coding assistant. An agent saying it finished is not proof that anything is finished, and the product exists because of that sentence."
        }
      ]
    },
    {
      id: "prelaunch",
      heading: "It is pre-launch, and the waitlist is not a purchase",
      blocks: [
        {
          kind: "text",
          text: "Orvay is not generally available. Joining the waitlist buys nothing, reserves nothing, and creates no entitlement to a place, a price or a launch date. No payment is taken. We may change the product, the plans and the prices before launch, and we may decide not to launch at all."
        },
        {
          kind: "text",
          text: "Anything shown as simulated did not touch an external system. We label it on the artifact itself, because a demonstration presented as a real run is a lie whatever the disclaimer at the bottom of the page says."
        }
      ]
    },
    {
      id: "account",
      heading: "Your account",
      blocks: [
        {
          kind: "text",
          text: "You are responsible for the security of your account and for everything done through it. Tell us as soon as you think somebody else has access. You must be old enough to enter into a contract where you live."
        }
      ]
    },
    {
      id: "acceptable-use",
      heading: "What you may not do",
      blocks: [
        {
          kind: "list",
          items: [
            "Break the law, or use Orvay to help somebody else break it.",
            "Send cold outreach, spam, or any message to a person who has given no basis for being contacted. The product refuses this at the consent gate, and doing it by another route is still a breach of these terms.",
            "Attack the service, probe it for weaknesses without asking us first, or try to reach data belonging to another customer.",
            "Resell the service, sublicense it, or run it for a third party without a written agreement with us.",
            "Try to make an agent take an action you could not lawfully take yourself.",
            "Upload personal data you have no lawful basis to hold."
          ]
        },
        {
          kind: "text",
          text: "We may suspend an account that is doing any of this. Where we can, we will tell you first and give you a chance to put it right. Where the harm is immediate we will suspend first and explain afterwards."
        }
      ]
    },
    {
      id: "your-instructions",
      heading: "What your agents do is your responsibility",
      blocks: [
        {
          kind: "text",
          text: "You decide what your agents may do. You set the goals, grant the capabilities, approve the actions that need approval, and set the budget. An action taken inside the authority you granted is your action, not ours."
        },
        {
          kind: "text",
          text: "This is not a disclaimer bolted on afterwards. The product is built so that the authority is explicit and the record shows who granted it. Read what you approve, because the approval record is the evidence that you did."
        },
        {
          kind: "text",
          text: "Some things are refused by the product and cannot be granted at all. Outbound telephone calls placed by an agent are one of them, permanently."
        }
      ]
    },
    {
      id: "ip",
      heading: "Who owns what",
      blocks: [
        {
          kind: "pairs",
          items: [
            {
              term: "Our software",
              detail: "The Orvay software, the design system, the documentation and the brand stay ours. Using the service gives you a limited, revocable, non-exclusive right to use it while your account is active, and nothing more."
            },
            {
              term: "Your content",
              detail: "Everything you put in stays yours: your goals, your documents, your contacts, your policies. We claim no ownership of it, and we do not use it to train models."
            },
            {
              term: "Work product",
              detail: "What the product makes for you, including generated websites, copy and code, is yours. We claim no ownership of the output."
            },
            {
              term: "Feedback",
              detail: "If you send us an idea for the product we may use it without owing you anything. Do not send us anything confidential as feedback."
            }
          ]
        },
        {
          kind: "text",
          text: "Exporting your personal data is a right, so it is free on every plan including the free one. Exporting a generated website is a product feature, and it is part of what a paid plan buys. We keep those two apart deliberately, and we say which is which on the pricing page rather than after you have paid."
        }
      ]
    },
    {
      id: "availability",
      heading: "Availability",
      blocks: [
        {
          kind: "text",
          text: "We promise no uptime. There is no service level agreement, no guaranteed support response time, and one person operating the service. When we can offer those, we will write them down and charge for them."
        },
        {
          kind: "text",
          text: "We may change or withdraw features. If a change removes something you rely on, we will give you notice and, where the change is material, a way out."
        }
      ]
    },
    {
      id: "money",
      heading: "Money",
      blocks: [
        {
          kind: "text",
          text: "Nothing is charged today. When plans go on sale, the price, what it includes and every limit will be stated on the pricing page before you pay, not after. Quota is measured in what your usage actually costs us, and credits are how that is displayed. The free plan stops when its allowance is gone and never runs up a bill."
        }
      ]
    },
    {
      id: "warranty",
      heading: "What we do not promise",
      blocks: [
        {
          kind: "text",
          text: "The service is provided as it is. So far as Swiss law permits, we give no warranty that it will be uninterrupted or error free, that it is fit for a particular purpose, or that any output is correct."
        },
        {
          kind: "text",
          text: "Verification is an independence mechanism, not an oracle. A verified result means a second actor checked the first one and the evidence was recorded. It does not mean the outcome is guaranteed correct, and we do not sell it as one."
        }
      ]
    },
    {
      id: "liability",
      heading: "Liability, honestly",
      blocks: [
        {
          kind: "text",
          text: "Swiss law does not allow us to exclude liability for unlawful intent or for gross negligence in advance. Art. 100(1) of the Swiss Code of Obligations makes such a clause void. We have not written one."
        },
        {
          kind: "text",
          text: "For slight negligence, our liability is limited to what you paid us in the twelve months before the event, and we are not liable for indirect or consequential loss, for lost profit, or for lost data beyond what we can restore from our own archive. Today that amount is zero, because nothing is charged."
        },
        {
          kind: "text",
          text: "Nothing here limits liability for death or personal injury, or any other liability that cannot be limited under the law that applies to you. If you are a consumer, the mandatory consumer protection of your own country still applies, and these terms do not take it away."
        }
      ]
    },
    {
      id: "termination",
      heading: "Ending it",
      blocks: [
        {
          kind: "text",
          text: "You can stop using the service at any time and ask us to close your account. We will export your data on request first."
        },
        {
          kind: "text",
          text: "We can end this agreement if you breach these terms and do not put it right within a reasonable time after we ask, or immediately where the breach is serious. We can also end it on 30 days notice if we stop offering the service."
        },
        {
          kind: "text",
          text: "When it ends we return or delete your data on request. The audit chain that proves what happened cannot be deleted without destroying that proof, so the personal data inside it is destroyed instead and the remainder stays."
        }
      ]
    },
    {
      id: "changes",
      heading: "Changing these terms",
      blocks: [
        {
          kind: "text",
          text: "We can change these terms, and the date at the top says when they last changed. For a change that materially affects you we will give at least 30 days notice by email to the address on your account, or on the website if you have no account. Continuing to use the service after the change takes effect means you accept it. If you do not accept it, stop using the service and ask us to close your account."
        }
      ]
    },
    {
      id: "law",
      heading: "Law and forum",
      blocks: [
        {
          kind: "text",
          text: "Swiss law applies, without its conflict of law rules and without the United Nations Convention on Contracts for the International Sale of Goods."
        },
        {
          kind: "text",
          text: "The courts of Basel, Switzerland have jurisdiction. If you are a consumer this does not remove your right to bring a claim in the courts where you live, or the protection of the mandatory law there. The Lugano Convention gives you that, and we are not trying to contract around it."
        },
        {
          kind: "text",
          text: "If a clause here turns out to be invalid, the rest stays in force."
        }
      ]
    },
    {
      id: "contact",
      heading: "Contact",
      blocks: [
        {
          kind: "pairs",
          items: [
            { term: "Email", detail: CONTROLLER.email },
            { term: "Post", detail: `${CONTROLLER.name}, ${POSTAL_ADDRESS}` }
          ]
        }
      ]
    }
  ]
};
var IMPRINT = {
  id: "imprint",
  title: "Imprint",
  lead: "Who runs this website, and where to reach them.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "provider",
      heading: "Provider",
      blocks: [
        {
          kind: "pairs",
          items: [
            { term: "Responsible person", detail: CONTROLLER.name },
            { term: "Legal form", detail: CONTROLLER.form },
            { term: "Address", detail: POSTAL_ADDRESS },
            { term: "Email", detail: CONTROLLER.email }
          ]
        },
        { kind: "hosts" },
        {
          kind: "text",
          text: "Art. 3(1)(s) of the Swiss Federal Act against Unfair Competition requires anyone offering something over the internet to give a clear statement of identity and a contact address. This page is that statement."
        }
      ]
    },
    {
      id: "register",
      heading: "Commercial register",
      blocks: [
        { kind: "text", text: CONTROLLER.register },
        {
          kind: "text",
          text: "This page changes on the day that changes. Until then, the person named above is personally the provider of these sites."
        }
      ]
    },
    {
      id: "vat",
      heading: "VAT",
      blocks: [
        {
          kind: "text",
          text: "Not registered for Swiss VAT. There is no UID, so there is no VAT number. If that changes, the number appears here."
        }
      ]
    },
    {
      id: "editorial",
      heading: "Responsibility for the content",
      blocks: [
        {
          kind: "text",
          text: `${CONTROLLER.name} is responsible for the content of these sites, at the address above.`
        },
        {
          kind: "text",
          text: "Anything shown as simulated is a demonstration and did not touch an external system. We label it on the artifact itself rather than relying on a note at the bottom of a page."
        }
      ]
    },
    {
      id: "links",
      heading: "Links",
      blocks: [
        {
          kind: "text",
          text: "Where we link to a site we do not run, we do not control what it says and we take no responsibility for it. Tell us if a link is broken or points somewhere it should not."
        }
      ]
    },
    {
      id: "disputes",
      heading: "Dispute resolution",
      blocks: [
        {
          kind: "text",
          text: "We are not obliged to take part in proceedings before a consumer arbitration board, and we do not do so. Write to the address above and a person reads it."
        },
        {
          kind: "text",
          text: "We do not link to the online dispute resolution platform of the European Commission, and we make no claim about whether it is available. That platform was created for traders established in the European Union. We are established in Switzerland."
        }
      ]
    },
    {
      id: "security",
      heading: "Reporting a security problem",
      blocks: [
        {
          kind: "text",
          text: `Write to ${CONTROLLER.email}. The security contact page says what to include and what happens next.`
        }
      ]
    }
  ]
};
var SUB_PROCESSOR_NOTICE = {
  id: "subprocessors",
  title: "Sub-processors",
  lead: "Every third party that processes data for us: what it gets, where it processes, and whether it is receiving anything today.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "how-to-read",
      heading: "How to read this",
      blocks: [
        {
          kind: "text",
          text: "This list is derived from the deployment configuration rather than from memory: the bindings each Worker holds, the environment variables it may carry, and the vendor libraries in the codebase. Each entry carries one of three states."
        },
        {
          kind: "pairs",
          items: [
            {
              term: SUB_PROCESSOR_STATUS_LABEL.in_use,
              detail: "Data is flowing to this provider now."
            },
            {
              term: SUB_PROCESSOR_STATUS_LABEL.configured,
              detail: "The wiring is real, and whether anything reaches the provider depends on a credential set for that deployment. We list it because it may be receiving data."
            },
            {
              term: SUB_PROCESSOR_STATUS_LABEL.not_engaged,
              detail: "The name appears in the product and is connected to nothing. It receives no data at all."
            }
          ]
        },
        {
          kind: "text",
          text: "We keep the third state rather than deleting those rows. A vendor name that a customer can see in the product and cannot find on this list is what makes a sub-processor list untrustworthy."
        },
        {
          kind: "text",
          text: "Each provider uses its own sub-processors, for example the cloud infrastructure underneath a managed database. Each of them publishes its own list."
        }
      ]
    },
    {
      id: "list",
      heading: "The list",
      blocks: [{ kind: "subprocessors" }]
    },
    {
      id: "changes",
      heading: "Changing the list",
      blocks: [
        {
          kind: "text",
          text: "We give customers at least 30 days notice by email before a new sub-processor starts processing their personal data, and you may object in writing during that period on reasonable data protection grounds. If we cannot resolve the objection you may terminate the affected service without penalty. That commitment is part of the data processing agreement, not a courtesy."
        }
      ]
    }
  ]
};
var SECURITY_CONTACT = {
  email: CONTROLLER.email,
  /** BCP 47 tags, in the order we would prefer to read a report. */
  preferredLanguages: ["en", "de"],
  acknowledgeWithin: "72 hours",
  disclosureWindowDays: 90
};
var SECURITY_POLICY = {
  id: "security",
  title: "Security contact",
  lead: "How to report a vulnerability, and what happens after you do.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      id: "report",
      heading: "Reporting",
      blocks: [
        {
          kind: "pairs",
          items: [
            { term: "Email", detail: SECURITY_CONTACT.email },
            { term: "Preferred languages", detail: "English, then German." }
          ]
        },
        {
          kind: "text",
          text: `Send what you found, how to reproduce it, and what you think the impact is. One person reads that address and will acknowledge within ${SECURITY_CONTACT.acknowledgeWithin}.`
        },
        {
          kind: "text",
          text: "Please do not test against data belonging to other people. If a proof needs a second account, ask and we will make one for you."
        }
      ]
    },
    {
      id: "scope",
      heading: "Scope",
      blocks: [
        {
          kind: "text",
          text: "The sites below, and the product behind them. Anything hosted by a provider on our behalf is theirs to receive, so report it to them and tell us as well."
        },
        { kind: "hosts" }
      ]
    },
    {
      id: "no-bounty",
      heading: "No bug bounty",
      blocks: [
        {
          kind: "text",
          text: "We do not pay for reports. This is one person before launch with no revenue, and pretending otherwise would waste your time. We will credit you if you want the credit, and we will tell you what we did about the report."
        }
      ]
    },
    {
      id: "disclosure",
      heading: "Disclosure",
      blocks: [
        {
          kind: "text",
          text: `Tell us first, and give us ${SECURITY_CONTACT.disclosureWindowDays} days before publishing. If we fix it sooner we will say so and you can publish then.`
        },
        {
          kind: "text",
          text: "If we go quiet, publish. Silence from us is not a reason for a vulnerability to stay secret."
        }
      ]
    },
    {
      id: "security-txt",
      heading: "security.txt",
      blocks: [
        {
          kind: "text",
          text: "The machine readable version of this page follows RFC 9116. It gives the contact address, the preferred languages, the canonical location of the file itself, and an expiry date after which it should not be trusted."
        }
      ]
    }
  ]
};

// ../../packages/content/src/index.ts
var BRAND = {
  name: "Orvay",
  legalName: "Orvay",
  category: "Autonomous Company Operating System",
  tagline: "Give your company a goal. Watch the work get done. And verified."
};

// src/targets.ts
var DEFAULT_THRESHOLDS = {
  // Measured from a laptop on 2026-08-18: site 75ms, docs 381ms, app 677ms.
  // A GitHub runner is a different network with different variance, so the
  // threshold sits well above the observed spread. A threshold tuned to a good
  // day produces a degraded row every time somebody else's network hiccups, and
  // a page that cries wolf is a page nobody reads.
  degradedAboveMs: 3e3,
  timeoutMs: 1e4
};
var TARGETS = [
  {
    component: "marketing-and-docs",
    url: HOSTS.site,
    // The tagline, from the package that owns it.
    bodyMarker: BRAND.tagline,
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true
  },
  {
    component: "control-plane",
    url: HOSTS.app,
    // THE MARKER IS THE REDIRECT, AND THIS ROW IS THE REASON THE HEADER ABOVE
    // EXISTS. Every product route now sends a signed-out visitor to the login
    // page with a `<meta http-equiv="refresh">` and a 200, because loading.tsx
    // puts each route behind a Suspense boundary. The first version of this
    // target asserted `BRAND.category`, which appears in the redirect shell's
    // own <title>, so the row reported operational off a page that contains the
    // words "Loading your company" and nothing else. It would have kept
    // reporting operational with the entire authenticated app broken.
    //
    // Asserting the redirect instead measures three real things: the Worker is
    // serving, routing works, and the gate is closed. The third is the valuable
    // one. If this marker ever goes missing because the app started serving
    // itself to a signed-out visitor, that is a security regression and this
    // probe is what catches it.
    //
    // What it still cannot prove is what a signed-in customer sees, and the
    // row's own summary says so rather than leaving it implied.
    bodyMarker: `url=${LOGIN_PATH}`,
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true
  },
  {
    component: "sign-in",
    url: `${HOSTS.app}${LOGIN_PATH}`,
    // A class name rather than a heading. Copy changes; the auth form's own
    // class does not, and this marker exists to notice the form being gone.
    bodyMarker: "a-auth__title",
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS
  },
  {
    component: "website-studio",
    url: HOSTS.studio,
    bodyMarker: `${BRAND.name} studio`,
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true
  },
  {
    component: "tenant-sites",
    url: HOSTS.tenants,
    bodyMarker: new URL(HOSTS.tenants).hostname,
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true,
    headers: [
      {
        name: "cross-origin-resource-policy",
        contains: "cross-origin",
        because: "a sandboxed site could not load its own assets when this was same-origin, and the fix is only observable from outside"
      }
    ]
  }
];
var SECONDARY_TARGETS = [
  {
    component: "marketing-and-docs",
    url: HOSTS.docs,
    // The documentation index heading's id. Stable across prose edits.
    bodyMarker: 'id="documentation"',
    expectStatus: 200,
    thresholds: DEFAULT_THRESHOLDS,
    checkCertificate: true
  }
];
var ALL_TARGETS = [...TARGETS, ...SECONDARY_TARGETS];

// src/probe.ts
import { connect as tlsConnect } from "node:tls";
var USER_AGENT = `orvay-status-probe (+${HOSTS.status})`;
var VANTAGE = "github-actions";
var CONFIRMATIONS = 3;
var CONFIRMATION_DELAY_MS = 2e3;
var classifyError = (error) => {
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  const cause = error instanceof Error ? error.cause : void 0;
  const code = cause !== null && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "ENODATA") return "dns-failure";
  if (code === "ECONNREFUSED") return "connection-refused";
  if (code === "UND_ERR_CONNECT_TIMEOUT" || code === "UND_ERR_HEADERS_TIMEOUT") return "timeout";
  if (code.startsWith("CERT_") || code.startsWith("ERR_TLS") || code === "DEPTH_ZERO_SELF_SIGNED_CERT" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || code === "SELF_SIGNED_CERT_IN_CHAIN") {
    return "tls-failure";
  }
  return "probe-errored";
};
var attempt = async (target, fetchImpl, clock) => {
  const started = clock();
  try {
    const response = await fetchImpl(target.url, {
      // A status page must see what a visitor sees, and a visitor is not served
      // from a cache we warmed. `no-store` also stops a runner-side cache
      // reporting a page that has since stopped being served.
      cache: "no-store",
      redirect: "follow",
      headers: {
        // Identifying the prober is a courtesy that also makes our own traffic
        // filterable out of analytics, so the page cannot inflate its own
        // visitor numbers.
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml"
      },
      signal: AbortSignal.timeout(target.thresholds.timeoutMs)
    });
    const body = await response.text();
    const latencyMs = clock() - started;
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name.toLowerCase()] = value;
    });
    return { kind: "responded", status: response.status, latencyMs, body, headers };
  } catch (error) {
    return { kind: "failed", failure: classifyError(error) };
  }
};
var gradeResponse = (target, responded) => {
  if (responded.status >= 500) return { level: "major-outage", note: `status ${responded.status}` };
  if (responded.status !== target.expectStatus) {
    return { level: "partial-outage", note: `status ${responded.status}` };
  }
  if (!responded.body.includes(target.bodyMarker)) {
    return { level: "partial-outage", note: "page did not contain its expected content" };
  }
  for (const assertion of target.headers ?? []) {
    const value = responded.headers[assertion.name.toLowerCase()] ?? "";
    if (!value.toLowerCase().includes(assertion.contains.toLowerCase())) {
      return { level: "partial-outage", note: `${assertion.name} is not as expected` };
    }
  }
  if (responded.latencyMs > target.thresholds.degradedAboveMs) {
    return { level: "degraded", note: "slower than usual" };
  }
  return { level: "operational" };
};
var sleep = (ms) => new Promise((resolve2) => {
  setTimeout(resolve2, ms);
});
var probeTarget = async (target, fetchImpl, clock, delay = sleep) => {
  let last = "probe-errored";
  for (let n = 1; n <= CONFIRMATIONS; n += 1) {
    const result = await attempt(target, fetchImpl, clock);
    if (result.kind === "responded") {
      const graded = gradeResponse(target, result);
      return { kind: "measured", level: graded.level, latencyMs: result.latencyMs, note: graded.note };
    }
    last = result.failure;
    if (n < CONFIRMATIONS) await delay(CONFIRMATION_DELAY_MS * n);
  }
  return { kind: "unreachable", failure: last, attempts: CONFIRMATIONS };
};
var applyPositiveControl = (readings) => {
  const anythingAnswered = [...readings.values()].some((r) => r.kind === "measured");
  const resolved = /* @__PURE__ */ new Map();
  for (const [key, reading] of readings) {
    if (reading.kind === "measured") {
      resolved.set(key, {
        kind: "measured",
        level: reading.level,
        latencyMs: reading.latencyMs,
        note: reading.note
      });
      continue;
    }
    resolved.set(
      key,
      anythingAnswered ? { kind: "measured", level: "major-outage", latencyMs: 0, note: reading.failure } : (
        // The prober is the suspect. Say so rather than declaring five
        // simultaneous outages from one machine's bad afternoon.
        { kind: "unknown", reason: "probe-errored" }
      )
    );
  }
  return resolved;
};
var certificateDaysRemaining = async (host, now, timeoutMs = 1e4) => new Promise((resolve2) => {
  const socket = tlsConnect({ host, port: 443, servername: host }, () => {
    const cert = socket.getPeerCertificate();
    socket.end();
    if (cert.valid_to === void 0) return resolve2(void 0);
    const expires = Date.parse(cert.valid_to);
    resolve2(Number.isNaN(expires) ? void 0 : (expires - now) / 864e5);
  });
  socket.setTimeout(timeoutMs, () => {
    socket.destroy();
    resolve2(void 0);
  });
  socket.on("error", () => {
    socket.destroy();
    resolve2(void 0);
  });
});

// src/vendors.ts
var VENDOR_FEEDS = [
  {
    component: "vendor-cloudflare",
    vendor: "Cloudflare",
    api: "https://www.cloudflarestatus.com/api/v2/status.json",
    permalink: "https://www.cloudflarestatus.com",
    shape: "statuspage-v2"
  },
  {
    component: "vendor-supabase",
    vendor: "Supabase",
    api: "https://status.supabase.com/api/v2/status.json",
    permalink: "https://status.supabase.com",
    shape: "statuspage-v2"
  },
  {
    component: "vendor-anthropic",
    vendor: "Anthropic",
    // Redirects to status.claude.com and the payload's `page.name` is "Claude"
    // rather than "Anthropic". The label shown to a reader is OURS, taken from
    // `vendor` above, so a vendor renaming their page cannot silently rename a
    // row on ours. Redirects are followed deliberately.
    api: "https://status.anthropic.com/api/v2/status.json",
    permalink: "https://status.claude.com",
    shape: "statuspage-v2"
  },
  {
    component: "vendor-openai",
    vendor: "OpenAI",
    api: "https://status.openai.com/api/v2/status.json",
    permalink: "https://status.openai.com",
    shape: "statuspage-v2"
  },
  {
    component: "vendor-stripe",
    vendor: "Stripe",
    // Not a Statuspage instance. A static object on CloudFront with its own
    // shape, and the one that proves why freshness is checked at all.
    api: "https://status.stripe.com/current",
    permalink: "https://status.stripe.com",
    shape: "stripe-current"
  },
  {
    component: "vendor-sentry",
    vendor: "Sentry",
    api: "https://status.sentry.io/api/v2/status.json",
    permalink: "https://status.sentry.io",
    shape: "statuspage-v2"
  }
];
var isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var parseVendorPayload = (shape, raw) => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return void 0;
  }
  if (!isRecord(parsed)) return void 0;
  if (shape === "statuspage-v2") {
    const status = parsed["status"];
    const page = parsed["page"];
    if (!isRecord(status) || typeof status["description"] !== "string") return void 0;
    const updatedRaw = isRecord(page) ? page["updated_at"] : void 0;
    const updatedAt = typeof updatedRaw === "string" && !Number.isNaN(Date.parse(updatedRaw)) ? Instant(Date.parse(updatedRaw)) : void 0;
    return { state: status["description"], updatedAt };
  }
  const message = parsed["message"];
  if (typeof message !== "string") return void 0;
  const timeRaw = parsed["time"];
  const cleaned = typeof timeRaw === "string" ? timeRaw.replace(" @ ", " ").replace(/(\d)(AM|PM)/i, "$1 $2") : "";
  const parsedTime = Date.parse(cleaned);
  return {
    state: message,
    updatedAt: Number.isNaN(parsedTime) ? void 0 : Instant(parsedTime)
  };
};
var readVendorFeed = async (feed, fetchText2, clock) => {
  const raw = await fetchText2(feed.api);
  const now = clock();
  if (raw === void 0) {
    return {
      method: "not-measured",
      why: `We could not reach ${feed.vendor}'s status feed, so we cannot show what they are reporting. Their own page is linked and remains the source of record.`
    };
  }
  const parsed = parseVendorPayload(feed.shape, raw);
  if (parsed === void 0) {
    return {
      method: "not-measured",
      why: `${feed.vendor}'s status feed answered in a format we do not recognise, so we are not showing a state we cannot read. Their own page is linked and remains the source of record.`
    };
  }
  return {
    method: "vendor-reported",
    vendor: feed.vendor,
    state: parsed.state,
    vendorUpdatedAt: parsed.updatedAt,
    fetchedAt: now,
    permalink: feed.permalink
  };
};

// src/render.ts
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var utc = (at) => {
  const d = new Date(at);
  const pad = (n) => String(n).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
};
var GLYPHS = {
  circle: '<circle cx="8" cy="8" r="5"/>',
  triangle: '<path d="M8 2.5 14 13H2Z"/>',
  square: '<rect x="3" y="3" width="10" height="10" rx="1"/>',
  cross: '<path d="M4 4 12 12M12 4 4 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  brokenRing: '<path d="M8 3a5 5 0 1 1-4.6 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  dashedRing: '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.2 2.4"/>',
  arrow: '<path d="M3 8h9M8.5 4.5 12.5 8l-4 3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
};
var LEVEL_STYLE = {
  operational: {
    word: "Operational",
    glyph: "circle",
    token: "var(--verified-text)",
    spoken: "Operational"
  },
  degraded: {
    word: "Degraded",
    glyph: "triangle",
    token: "var(--risk-medium-text)",
    spoken: "Degraded, slower or less reliable than usual"
  },
  "partial-outage": {
    word: "Partial outage",
    glyph: "square",
    token: "var(--risk-high-text)",
    spoken: "Partial outage, some of this is not working"
  },
  "major-outage": {
    word: "Major outage",
    glyph: "cross",
    token: "var(--risk-critical-text)",
    spoken: "Major outage, this is not working"
  }
};
var UNKNOWN_STYLE = {
  word: "Unknown",
  glyph: "brokenRing",
  // Deliberately neutral. An unknown is not a mild problem and not a mild
  // success, and giving it amber would rank it below a degradation it might
  // easily be hiding.
  token: "var(--fg-secondary)",
  spoken: "Unknown, we could not measure this"
};
var NOT_MEASURED_STYLE = {
  word: "Not measured",
  glyph: "dashedRing",
  token: "var(--fg-secondary)",
  spoken: "Not measured, nothing watches this yet"
};
var VENDOR_STYLE = {
  word: "Reported",
  glyph: "arrow",
  token: "var(--fg-secondary)",
  spoken: "Reported by the vendor, not measured by us"
};
var REASON_TEXT = {
  timeout: "the check timed out",
  "dns-failure": "the address did not resolve",
  "tls-failure": "the security certificate did not validate",
  "connection-refused": "the connection was refused",
  "unexpected-status": "the response was not what we expect",
  "body-marker-missing": "the page did not contain its expected content",
  "probe-errored": "our own check could not run, so this says nothing about the service",
  "artifact-unreachable": "we could not read our own internal report",
  "artifact-malformed": "our own internal report was not readable",
  stale: "the last measurement is too old to rely on"
};
var badge = (style, detail) => `
      <span class="state" style="color:${style.token}">
        <svg class="glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="currentColor">${GLYPHS[style.glyph]}</svg>
        <span class="state-word">${esc(style.word)}</span>
        <span class="sr-only">${esc(style.spoken)}${detail === void 0 ? "" : `. ${detail}`}</span>
      </span>`;
var methodNote = (display) => {
  switch (display.kind) {
    case "measured":
      return `Checked from outside our network at ${esc(utc(display.observedAt))}${display.latencyMs === void 0 || display.latencyMs <= 0 ? "" : `, answered in ${Math.round(display.latencyMs)} ms`}.`;
    case "unknown":
      return `Last attempt at ${esc(utc(display.observedAt))}: ${esc(REASON_TEXT[display.reason])}.`;
    case "vendor":
      return display.vendorUpdatedAt === void 0 ? `Read at ${esc(utc(display.fetchedAt))}. Their feed does not say when they last updated it.` : `Reported by them at ${esc(utc(display.vendorUpdatedAt))}. Read by us at ${esc(utc(display.fetchedAt))}.`;
    case "not-measured":
      return esc(display.why);
  }
};
var row = (label, summary, display, permalink) => {
  const style = display.kind === "measured" ? LEVEL_STYLE[display.level] : display.kind === "unknown" ? UNKNOWN_STYLE : display.kind === "vendor" ? VENDOR_STYLE : NOT_MEASURED_STYLE;
  const vendorState = display.kind === "vendor" ? `<p class="vendor-state">${esc(display.state)}${display.feedStale ? ' <span class="flag">Their feed has not changed recently, so treat this as out of date.</span>' : ""}</p>` : "";
  const link = permalink === void 0 ? "" : ` <a class="permalink" href="${esc(permalink)}" rel="noreferrer noopener">Their status page</a>`;
  return `
    <li class="row"${display.kind === "not-measured" ? ' data-unmeasured="true"' : ""}>
      <div class="row-main">
        <h3 class="row-label">${esc(label)}</h3>
        ${badge(style)}
      </div>
      <p class="row-summary">${esc(summary)}</p>
      ${vendorState}
      <p class="row-method">${methodNote(display)}${link}</p>
    </li>`;
};
var renderPage = (input) => {
  const now = input.generatedAt;
  const displays = /* @__PURE__ */ new Map();
  for (const spec of COMPONENTS) {
    const reading = input.readings[spec.id] ?? {
      method: "not-measured",
      why: spec.notMeasuredWhy ?? "Nothing watches this yet. This row is listed so its absence is visible rather than quiet."
    };
    displays.set(spec.id, displayFor(reading, now, spec.budget));
  }
  const overall = overallFrom([...displays.values()]);
  const overallStyle = overall.kind === "known" ? LEVEL_STYLE[overall.level] : UNKNOWN_STYLE;
  const overallHeadline = overall.kind === "known" ? overall.level === "operational" ? "Everything we measure is working" : `Something we measure is not working` : "We cannot currently tell you the state of the service";
  const completeness = overall.kind === "known" && !overall.complete ? `<p class="banner-caveat">This is a partial view. ${overall.measured} ${overall.measured === 1 ? "row is" : "rows are"} measured, ${overall.unknown} could not be measured just now, and ${overall.notMeasured} are not watched yet. A row we do not watch is listed below rather than left out.</p>` : overall.kind === "unknown" ? `<p class="banner-caveat">Nothing we watch reported successfully on the last run, which usually means our own checker failed rather than that everything is down. Until a check succeeds we will not guess.</p>` : "";
  const measuredRows = COMPONENTS.filter((c) => c.group === "measured").map((c) => row(c.label, c.summary, displays.get(c.id))).join("");
  const vendorRows = COMPONENTS.filter((c) => c.group === "vendor").map((c) => {
    const display = displays.get(c.id);
    return row(
      c.label,
      c.summary,
      display,
      display.kind === "vendor" ? display.permalink : void 0
    );
  }).join("");
  const fallback = input.fallbackChannel === void 0 ? "We have not yet published a second place to look. Until we do, this limitation is stated here rather than left for you to discover during an outage." : `If this page is unreachable, look at <a href="${esc(input.fallbackChannel.url)}" rel="noreferrer noopener">${esc(input.fallbackChannel.label)}</a>.`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(BRAND.name)} Status</title>
<meta name="description" content="Live operational status for ${esc(BRAND.name)}, with the way each row is measured stated beside it.">
<meta name="robots" content="index, follow">
<link rel="alternate" type="application/atom+xml" title="${esc(BRAND.name)} Status" href="/history.atom">
<style>
${input.tokensCss}

/* -------------------------------------------------------------------------
   The page itself. Every colour below is a token from the block above.
   ------------------------------------------------------------------------- */
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg-canvas);
  color: var(--fg-primary);
  font: var(--o-text-body-15);
  font-weight: var(--o-weight-regular);
  -webkit-font-smoothing: antialiased;
}

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}

.wrap { max-width: 62rem; margin: 0 auto; padding: var(--o-space-6) var(--o-space-4) var(--o-space-8); }

header.masthead {
  display: flex; flex-wrap: wrap; align-items: baseline;
  gap: var(--o-space-2) var(--o-space-4);
  padding-bottom: var(--o-space-5);
}
.brand { font: var(--o-text-title-19); font-weight: var(--o-weight-strong); }
.masthead .kicker { font: var(--o-text-label-14); color: var(--fg-secondary); }

/* Banner ---------------------------------------------------------------- */
.banner {
  background: var(--bg-raised);
  border: 1px solid var(--line-rule);
  border-radius: var(--o-radius-md);
  padding: var(--o-space-5);
  display: flex; flex-direction: column; gap: var(--o-space-3);
}
.banner h1 { font: var(--o-text-display-32); font-weight: var(--o-weight-regular); margin: 0; text-wrap: balance; }
.banner-caveat, .banner-limit { margin: 0; color: var(--fg-secondary); max-width: 60ch; }
.banner-limit { border-top: 1px solid var(--line-rule); padding-top: var(--o-space-3); }

/* State badge ------------------------------------------------------------ */
.state { display: inline-flex; align-items: center; gap: var(--o-space-2); white-space: nowrap; }
.glyph { width: 1em; height: 1em; flex: none; }
.state-word { font: var(--o-text-label-14); font-weight: var(--o-weight-medium); letter-spacing: 0.01em; }

/* Sections and rows ------------------------------------------------------ */
section { margin-top: var(--o-space-7); }
section > h2 { font: var(--o-text-title-24); font-weight: var(--o-weight-regular); margin: 0 0 var(--o-space-2); }
section > .section-note { margin: 0 0 var(--o-space-4); color: var(--fg-secondary); max-width: 62ch; }

ul.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px;
  background: var(--line-rule); border: 1px solid var(--line-rule); border-radius: var(--o-radius-md); overflow: hidden; }
.row { background: var(--bg-raised); padding: var(--o-space-4); display: flex; flex-direction: column; gap: var(--o-space-2); }

/* An unmeasured row is also carried by TEXTURE, reusing the provenance hatch,
   so it stays distinguishable in greyscale and in print where the neutral ink
   of "Not measured" and "Unknown" would otherwise converge. */
.row[data-unmeasured="true"] { background-image: var(--provenance-hatch); }

.row-main { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--o-space-2) var(--o-space-4); }
.row-label { font: var(--o-text-title-19); font-weight: var(--o-weight-medium); margin: 0; }
.row-summary { margin: 0; color: var(--fg-secondary); max-width: 66ch; }
.row-method { margin: 0; font: var(--o-text-mono-13); color: var(--fg-secondary); }
.vendor-state { margin: 0; font-weight: var(--o-weight-medium); }
.flag { display: inline-block; font: var(--o-text-label-14); color: var(--risk-medium-text); }

a { color: var(--accent-text); text-underline-offset: 0.16em; }
a:focus-visible, :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: 3px; }
.permalink { font: var(--o-text-mono-13); }

/* Legend ----------------------------------------------------------------- */
dl.legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: var(--o-space-3) var(--o-space-5); margin: 0; }
dl.legend div { display: flex; flex-direction: column; gap: var(--o-space-1); }
dl.legend dt { font: var(--o-text-label-14); font-weight: var(--o-weight-medium); }
dl.legend dd { margin: 0; color: var(--fg-secondary); }

footer { margin-top: var(--o-space-7); padding-top: var(--o-space-5); border-top: 1px solid var(--line-rule); color: var(--fg-secondary); display: flex; flex-direction: column; gap: var(--o-space-3); }
footer p { margin: 0; max-width: 66ch; }

@media print {
  /* The hatch and every glyph are ink, so they survive on their own. This is
     reinforcement, not the carrier. */
  .row, .banner, .state, .glyph { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  a[href]::after { content: " (" attr(href) ")"; font: var(--o-text-mono-13); }
}
</style>
</head>
<body>
<main class="wrap">

  <header class="masthead">
    <span class="brand">${esc(BRAND.name)}</span>
    <span class="kicker">Service status</span>
  </header>

  <div class="banner">
    <h1>${esc(overallHeadline)}</h1>
    ${badge(overallStyle)}
    ${completeness}
    <p class="banner-limit">This page runs on servers that are not ours and not the ones ${esc(BRAND.name)} runs on, so an outage of our application layer does not take it down. It still depends on our domain name resolving. ${fallback}</p>
  </div>

  <section>
    <h2>What we measure</h2>
    <p class="section-note">Each row says how it is known and when it was last checked. A row nothing watches says so, and is never shown as working.</p>
    <ul class="rows">${measuredRows}
    </ul>
  </section>

  <section>
    <h2>What our providers report</h2>
    <p class="section-note">${esc(BRAND.name)} depends on these companies. We mirror what each one publishes about itself and we do not measure them, so these rows carry no history and no percentage. Their own page is the source of record.</p>
    <ul class="rows">${vendorRows}
    </ul>
  </section>

  <section>
    <h2>How to read this page</h2>
    <dl class="legend">
      <div><dt>Checked</dt><dd>We ran a request from outside our own network and it either worked or it did not.</dd></div>
      <div><dt>Reported</dt><dd>A provider published this about themselves. We are repeating it, with the time they last updated it.</dd></div>
      <div><dt>Unknown</dt><dd>We tried and could not get an answer. This is not the same as working, and not the same as broken.</dd></div>
      <div><dt>Not measured</dt><dd>Nothing watches this yet. We list it so you can see the gap instead of assuming coverage.</dd></div>
    </dl>
  </section>

  <footer>
    <p>Where your data lives: the database holding your company data is in Zurich, Switzerland. Requests to the models we use are processed by Anthropic and OpenAI, outside Switzerland and outside the EU. The evidence archive is pinned to the EU.</p>
    <p>We publish no uptime percentage. Every number of that kind we could publish today would be derived from our own account of our own incidents, and we would rather show you what each check found and when.</p>
    <p>You can follow this page by feed at <a href="/history.atom">history.atom</a>. Email notifications are not available. There is no sign-up form here because there is nothing to sign up to.</p>
    <p>Page built ${esc(utc(input.generatedAt))}. The service itself is at <a href="${esc(HOSTS.site)}">${esc(HOSTS.site.replace("https://", ""))}</a>.</p>
  </footer>

</main>
</body>
</html>
`;
};

// src/feed.ts
var rfc3339 = (at) => new Date(at).toISOString();
var SPOKEN = {
  operational: "operational",
  degraded: "degraded",
  "partial-outage": "a partial outage",
  "major-outage": "a major outage",
  unknown: "unknown, because we could not measure it",
  "not-measured": "not measured",
  reported: "whatever the provider reports"
};
var entry = (e, origin) => `
  <entry>
    <id>tag:status,${rfc3339(e.at).slice(0, 10)}:${esc(e.component)}:${e.at}</id>
    <title>${esc(e.label)} is now ${esc(SPOKEN[e.to])}</title>
    <updated>${rfc3339(e.at)}</updated>
    <link rel="alternate" href="${esc(origin)}/"/>
    <content type="text">${esc(e.label)} changed from ${esc(SPOKEN[e.from])} to ${esc(SPOKEN[e.to])} at ${rfc3339(e.at)}.</content>
  </entry>`;
var renderFeed = (entries, generatedAt, origin) => {
  const newest = entries[0]?.at ?? generatedAt;
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(BRAND.name)} Status</title>
  <subtitle>Changes to what we measure. Nothing is published here unless a state actually changed.</subtitle>
  <id>${esc(origin)}/</id>
  <link rel="self" href="${esc(origin)}/history.atom"/>
  <link rel="alternate" href="${esc(origin)}/"/>
  <updated>${rfc3339(newest)}</updated>${entries.slice(0, 200).map((e) => entry(e, origin)).join("")}
</feed>
`;
};

// src/history.ts
var stateOf = (display) => {
  switch (display.kind) {
    case "measured":
      return display.level;
    case "unknown":
      return "unknown";
    case "vendor":
      return "reported";
    case "not-measured":
      return "not-measured";
  }
};
var EMPTY_HISTORY = { schema: 1, entries: [] };
var isRecord2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var readHistory = (raw) => {
  if (raw === void 0) return EMPTY_HISTORY;
  try {
    const parsed = JSON.parse(raw);
    if (!isRecord2(parsed) || parsed["schema"] !== 1) return EMPTY_HISTORY;
    const entries = parsed["entries"];
    if (!Array.isArray(entries)) return EMPTY_HISTORY;
    const clean = entries.filter(
      (e) => isRecord2(e) && typeof e["at"] === "number" && typeof e["component"] === "string" && typeof e["label"] === "string" && typeof e["from"] === "string" && typeof e["to"] === "string"
    );
    return { schema: 1, entries: clean };
  } catch {
    return EMPTY_HISTORY;
  }
};
var transitions = (previous, current, labels, at) => {
  const out = [];
  for (const [component, display] of current) {
    const before = previous[component];
    if (before === void 0) continue;
    const after = stateOf(display);
    if (before === after) continue;
    out.push({ at, component, label: labels[component] ?? component, from: before, to: after });
  }
  return out;
};
var append = (history, entries) => ({ schema: 1, entries: [...entries, ...history.entries] });

// src/build.ts
var sourceCommit = true ? "b93f8bd" : "unknown";
var CERT_WARN_DAYS = 14;
var readIfPresent = async (path) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return void 0;
  }
};
var fetchText = async (url, timeoutMs = 12e3) => {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) return void 0;
    return await response.text();
  } catch {
    return void 0;
  }
};
var foldOntoComponents = (resolved, targets, at) => {
  const byComponent = /* @__PURE__ */ new Map();
  const rank = {
    operational: 0,
    degraded: 1,
    "partial-outage": 2,
    "major-outage": 3
  };
  for (const target of targets) {
    const result = resolved.get(target.url);
    if (result === void 0) continue;
    const reading = result.kind === "measured" ? {
      method: "probe",
      vantage: VANTAGE,
      observedAt: at,
      observation: { kind: "ok", level: result.level, latencyMs: result.latencyMs }
    } : {
      method: "probe",
      vantage: VANTAGE,
      observedAt: at,
      observation: { kind: "unknown", reason: result.reason }
    };
    const existing = byComponent.get(target.component);
    if (existing === void 0) {
      byComponent.set(target.component, reading);
      continue;
    }
    const existingWorse = existing.method === "probe" && existing.observation.kind === "ok" && reading.method === "probe" && reading.observation.kind === "ok" && (rank[existing.observation.level] ?? 0) >= (rank[reading.observation.level] ?? 0);
    const existingIsUnknown = existing.method === "probe" && existing.observation.kind === "unknown";
    const incomingIsUnknown = reading.method === "probe" && reading.observation.kind === "unknown";
    if (existingIsUnknown && !incomingIsUnknown) {
      byComponent.set(target.component, reading);
    } else if (!existingWorse && !incomingIsUnknown) {
      byComponent.set(target.component, reading);
    }
  }
  return byComponent;
};
var main = async (outDir) => {
  const at = Instant(Date.now());
  const perTarget = /* @__PURE__ */ new Map();
  await Promise.all(
    ALL_TARGETS.map(async (target) => {
      const reading = await probeTarget(target, fetch, () => performance.now());
      perTarget.set(target.url, reading);
    })
  );
  const resolved = applyPositiveControl(perTarget);
  const readings = foldOntoComponents(resolved, ALL_TARGETS, at);
  for (const target of ALL_TARGETS.filter((t) => t.checkCertificate)) {
    const host = new URL(target.url).hostname;
    const days = await certificateDaysRemaining(host, at);
    if (days === void 0 || days > CERT_WARN_DAYS) continue;
    const existing = readings.get(target.component);
    if (existing?.method === "probe" && existing.observation.kind === "ok" && existing.observation.level === "operational") {
      readings.set(target.component, {
        ...existing,
        observation: { kind: "ok", level: "degraded", latencyMs: existing.observation.latencyMs }
      });
    }
  }
  await Promise.all(
    VENDOR_FEEDS.map(async (feed) => {
      readings.set(feed.component, await readVendorFeed(feed, (u) => fetchText(u), () => Instant(Date.now())));
    })
  );
  const previousRaw = await readIfPresent(join(outDir, "summary.json"));
  const previousStates = {};
  if (previousRaw !== void 0) {
    try {
      const prev = JSON.parse(previousRaw);
      Object.assign(previousStates, prev.states ?? {});
    } catch {
    }
  }
  const displays = /* @__PURE__ */ new Map();
  const states = {};
  const labels = {};
  for (const spec of COMPONENTS) {
    const reading = readings.get(spec.id) ?? {
      method: "not-measured",
      why: spec.notMeasuredWhy ?? "Nothing watches this yet."
    };
    const display = displayFor(reading, at, spec.budget);
    displays.set(spec.id, display);
    states[spec.id] = stateOf(display);
    labels[spec.id] = spec.label;
  }
  const history = append(
    readHistory(await readIfPresent(join(outDir, "history.json"))),
    transitions(previousStates, displays, labels, at)
  );
  const snapshot = {
    schema: 1,
    generatedAt: at,
    readings: Object.fromEntries(readings)
  };
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(join(outDir, "index.html"), renderPage({ generatedAt: at, readings: snapshot.readings, tokensCss: tokens_default })),
    writeFile(
      join(outDir, "summary.json"),
      `${JSON.stringify({ ...snapshot, states, sourceCommit }, null, 2)}
`
    ),
    writeFile(join(outDir, "history.json"), `${JSON.stringify(history, null, 2)}
`),
    writeFile(join(outDir, "history.atom"), renderFeed(history.entries, at, HOSTS.status)),
    // GitHub Pages needs this file to serve a custom domain, and it needs to be
    // in the published output rather than the source, because the output branch
    // is what Pages reads.
    writeFile(join(outDir, "CNAME"), `${new URL(HOSTS.status).hostname}
`),
    // Jekyll would otherwise try to process the output and drop files starting
    // with an underscore. Nothing here starts with one today, and relying on
    // that is exactly the sort of assumption that breaks quietly later.
    writeFile(join(outDir, ".nojekyll"), "")
  ]);
  const summary = [...displays.entries()].map(([id, d]) => `${id}: ${stateOf(d)}`).join("\n");
  console.log(
    `status built at ${new Date(at).toISOString()} from ${sourceCommit}
${summary}`
  );
};
var outArg = process.argv[2];
if (outArg !== void 0) {
  await main(resolve(outArg));
}
export {
  main
};
