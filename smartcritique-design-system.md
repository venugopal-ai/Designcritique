# Smart Critique Design System
> Version 1.0 · Built with Figma MCP · Primary `#004A99` · WCAG AAA

---

## Table of Contents

1. [Overview](#overview)
2. [Color Tokens](#color-tokens)
3. [Typography](#typography)
4. [Spacing & Radius](#spacing--radius)
5. [Atoms](#atoms)
6. [Molecules](#molecules)
7. [Usage Rules](#usage-rules)
8. [Accessibility](#accessibility)

---

## Overview

| Property | Value |
|---|---|
| Product | Smart Critique · Heuristic & Accessibility Design Reviews |
| Primary color | `#004A99` (WCAG AAA — 8.60:1 on white) |
| Font | Inter |
| Base unit | 4px |
| Platform | Mobile-first (375px) |
| Token system | Figma Variables — Primitives + Semantic |
| File | `EkQ5Mca7xkswak3pbT0K4P` |

---

## Color Tokens

### Primitives — Brand (Blue)

| Token | Hex | Usage |
|---|---|---|
| `color/brand/50` | `#EBF2FC` | Active state backgrounds, pill fills |
| `color/brand/100` | `#CFE1F5` | Hover tints |
| `color/brand/200` | `#9DC3EC` | — |
| `color/brand/300` | `#5A9ADE` | — |
| `color/brand/400` | `#0C72E0` | — |
| `color/brand/500` | `#004A99` | **Primary brand color** |
| `color/brand/600` | `#003A7A` | Hover on primary |
| `color/brand/700` | `#002B5C` | Pressed state |
| `color/brand/800` | `#001D3D` | — |
| `color/brand/900` | `#00101F` | — |

### Primitives — Gray

| Token | Hex | Usage |
|---|---|---|
| `color/gray/50` | `#FAFAFA` | Focused field background |
| `color/gray/100` | `#F4F3F0` | Default field/chip background |
| `color/gray/200` | `#E8E7E3` | Hover field background |
| `color/gray/300` | `#D1D0CC` | Disabled borders, dividers |
| `color/gray/700` | `#3D3D3B` | — |
| `color/gray/800` | `#2A2A28` | — |
| `color/gray/900` | `#1A1A18` | — |

### Primitives — Feedback

| Token | Hex | Usage |
|---|---|---|
| `color/green/500` | `#16A34A` | Success |
| `color/red/500` | `#DC2626` | Error / Danger |
| `color/amber/500` | `#D97706` | Warning |
| `color/blue/500` | `#2563EB` | Info |

---

### Semantic Tokens

#### Surface
| Token | Value | Usage |
|---|---|---|
| `color/surface/page` | gray/50 | App background |
| `color/surface/card` | #FFFFFF | Cards, modals, nav bar |
| `color/surface/sunken` | gray/100 | Recessed areas |
| `color/surface/raised` | #FFFFFF + shadow | Elevated surfaces |
| `color/surface/inverse` | gray/900 | Dark surfaces |

#### Text
| Token | Value | Usage |
|---|---|---|
| `color/text/primary` | gray/900 | Headings, body |
| `color/text/secondary` | gray/700 | Labels, subtitles |
| `color/text/tertiary` | gray/500 | Placeholder, helper |
| `color/text/disabled` | gray/400 | Disabled state |
| `color/text/inverse` | #FFFFFF | Text on dark/brand bg |
| `color/text/brand` | brand/500 `#004A99` | Links, active labels |
| `color/text/danger` | red/600 | Error messages |
| `color/text/success` | green/600 | Success messages |
| `color/text/warning` | amber/600 | Warning messages |
| `color/text/info` | blue/600 | Info messages |

#### Border
| Token | Value | Usage |
|---|---|---|
| `color/border/default` | gray/200 | Default field border |
| `color/border/strong` | gray/400 | Emphasis borders |
| `color/border/subtle` | gray/100 | Dividers, separators |
| `color/border/focus` | brand/500 `#004A99` | Focus ring |
| `color/border/error` | red/500 | Error field border |
| `color/border/success` | green/500 | Success field border |

#### Action
| Token | Value | Usage |
|---|---|---|
| `color/action/primary` | brand/500 `#004A99` | Primary buttons, CTAs |
| `color/action/primary/hover` | brand/600 `#003A7A` | Hover on primary button |
| `color/action/primary/pressed` | brand/700 `#002B5C` | Pressed primary button |
| `color/action/primary/disabled` | gray/300 | Disabled primary button |
| `color/action/secondary` | #FFFFFF | Secondary button fill |
| `color/action/danger` | red/500 | Danger button |

#### Feedback
| Token | Usage |
|---|---|
| `color/feedback/success/bg` | Success toast/field background |
| `color/feedback/success/text` | Success toast/badge text |
| `color/feedback/success/border` | Success field border |
| `color/feedback/warning/bg` | Warning toast/badge background |
| `color/feedback/warning/text` | Warning text |
| `color/feedback/error/bg` | Error field/toast background |
| `color/feedback/error/text` | Error text |
| `color/feedback/info/bg` | Info toast background |
| `color/feedback/info/text` | Info text |

---

## Typography

Font: **Inter** (Regular · Medium · SemiBold · Bold)

### Scale

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `Display/Display 2XL` | 48px | Bold | 110% | −1.5px | Dashboard KPIs, hero amounts |
| `Display/Display XL` | 36px | Bold | 115% | −1.0px | Large stat numbers |
| `Display/Display LG` | 28px | Bold | 120% | −0.5px | Section hero titles |
| `Heading/H1` | 24px | Bold | 125% | −0.3px | Screen title |
| `Heading/H2` | 20px | SemiBold | 130% | −0.2px | Section title |
| `Heading/H3` | 18px | SemiBold | 135% | −0.1px | Card title, modal title |
| `Heading/H4` | 16px | SemiBold | 140% | 0 | Sub-section heading |
| `Heading/H5` | 14px | SemiBold | 140% | 0 | List group title |
| `Body/Body LG` | 16px | Regular | 160% | 0 | Long-form text |
| `Body/Body LG Medium` | 16px | Medium | 160% | 0 | Emphasized body |
| `Body/Body MD` | 15px | Regular | 155% | 0 | Default body |
| `Body/Body MD Medium` | 15px | Medium | 155% | 0 | Links, highlights |
| `Body/Body SM` | 13px | Regular | 150% | 0 | Descriptions |
| `Body/Body SM Medium` | 13px | Medium | 150% | 0 | Emphasized small |
| `Label/Label LG` | 15px | Medium | 135% | 0 | Button text LG |
| `Label/Label MD` | 14px | Medium | 135% | 0 | Button text MD, nav |
| `Label/Label SM` | 13px | Medium | 130% | 0 | Button text SM, form labels |
| `Label/Label XS` | 12px | Medium | 130% | +0.1px | Badge text, tab labels |
| `Caption/Caption MD` | 12px | Regular | 140% | 0 | Helper text, footnotes |
| `Caption/Caption SM` | 11px | Regular | 140% | 0 | Timestamps, char count |
| `Caption/Overline` | 11px | SemiBold | 130% | +0.8px | Section labels (UPPERCASE) |
| `Mono/Mono MD` | 15px | Regular | 150% | 0 | Transaction amounts, OTP |
| `Mono/Mono SM` | 13px | Regular | 140% | 0 | Terminal IDs, codes |

---

## Spacing & Radius

### Spacing Scale (Base: 4px)

| Token | Value | CSS var |
|---|---|---|
| `space/0` | 0px | `--space-0` |
| `space/1` | 4px | `--space-1` |
| `space/2` | 8px | `--space-2` |
| `space/3` | 12px | `--space-3` |
| `space/4` | 16px | `--space-4` |
| `space/5` | 20px | `--space-5` |
| `space/6` | 24px | `--space-6` |
| `space/7` | 28px | `--space-7` |
| `space/8` | 32px | `--space-8` |
| `space/10` | 40px | `--space-10` |
| `space/12` | 48px | `--space-12` |
| `space/14` | 56px | `--space-14` |
| `space/16` | 64px | `--space-16` |
| `space/20` | 80px | `--space-20` |
| `space/24` | 96px | `--space-24` |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius/none` | 0px | — |
| `radius/sm` | 4px | Small chips, badges |
| `radius/md` | 6px | Tabs, small buttons |
| `radius/lg` | 8px | Inputs, buttons, cards |
| `radius/xl` | 10px | Cards, panels |
| `radius/2xl` | 12px | Large cards, modals |
| `radius/full` | 9999px | Pills, tags, avatars |

---

## Atoms

### Button

**Variants:** Primary · Secondary · Ghost · Danger · Link
**Sizes:** SM (36px) · MD (44px) · LG (52px)
**States:** Default · Hover · Focused · Pressed · Disabled · Loading
**Total:** 90 variants

```
Primary   → bg: color/action/primary    text: color/text/inverse
Secondary → bg: color/surface/card      text: color/text/primary   border: color/border/default
Ghost     → bg: transparent             text: color/action/primary
Danger    → bg: color/action/danger     text: color/text/inverse
Link      → bg: transparent             text: color/text/brand     underline on hover
```

**Heights:**
- SM: 36px · padding: 0 12px · font: Label SM (13px Medium)
- MD: 44px · padding: 0 16px · font: Label MD (14px Medium)
- LG: 52px · padding: 0 20px · font: Label LG (15px Medium)

---

### Input Field

**Pattern:** Option A — External label above, placeholder inside, disappears on type
**Types:** Text · Amount (₹ prefix) · Password (eye icon) · Search (⌕ prefix)
**Sizes:** SM (36px) · MD (44px) · LG (52px)
**States:** Default · Hover · Focused · Filled · Error · Success · Disabled
**Total:** 84 variants

```
Default  → bg: gray/100   border: none          placeholder: text/tertiary
Focused  → bg: gray/50    border: border/focus  glow: brand/500 @ 18% spread:3
Filled   → bg: gray/100   border: none          value: text/primary
Error    → bg: red/50     border: border/error  helper: text/danger
Success  → bg: green/50   border: border/success
Disabled → bg: gray/100   opacity: 0.4
```

**Leading prefix (Amount/Mobile):**
- ₹ symbol or +91 in text/secondary
- 1px separator line at gray/300
- Turns brand/500 on Focused

---

### OTP Input

**Types:** 4-Digit · 6-Digit
**Sizes:** SM (44px boxes) · MD (52px boxes) · LG (60px boxes)
**States:** Default · Focused · Partial · Filled · Error · Success
**Total:** 36 variants

```
Box:      cornerRadius: 8px
Active box: border: border/focus + glow
Bottom bar: 40% width, brand/500 on filled/focused
Digit:    textAlignHorizontal: CENTER, Inter Bold
```

---

### Textarea

**Sizes:** SM (96px) · MD (120px) · LG (148px)
**States:** Default · Focused · Filled · Error · Success · Disabled
**Total:** 18 variants

Resize handle: 2×2 dot grid, bottom-right corner

---

### Checkbox

**States:** Unchecked · Checked · Indeterminate
**Sizes:** SM (16px) · MD (20px) · LG (24px)
**States per variant:** Default · Hover · Focused · Disabled
**Total:** 36 variants

```
Unchecked  → border: border/default  bg: surface/card
Checked    → border: action/primary  bg: action/primary  checkmark: text/inverse
Indeterminate → same as checked with − mark
```

---

### Radio Button

**States:** Unselected · Selected · Disabled
**Sizes:** SM (16px) · MD (20px) · LG (24px)
**With/Without label**
**Total:** 18 variants

```
Selected: ring bg: brand/50  stroke: brand/500  dot: brand/500  glow: 3px spread
Label Selected: font weight: Medium (vs Regular default)
```

---

### Tag / Chip

**Types:**
- **Label** — read-only, 6 colors (Default/Brand/Success/Warning/Danger/Info)
- **Filter** — toggle interaction, 4 states (Default/Hover/Selected/Disabled)
- **Removable** — with × close button, 3 states

**Sizes:** SM (24px) · MD (28px) · LG (32px)
**Total:** 39 variants · shape: pill (radius/full)

```
Label colors:
  Default → bg: gray/100    text: gray/800
  Brand   → bg: brand/50   text: brand/800
  Success → bg: feedback/success/bg  text: feedback/success/text
  Warning → bg: feedback/warning/bg  text: feedback/warning/text
  Danger  → bg: feedback/error/bg    text: feedback/error/text
  Info    → bg: feedback/info/bg     text: feedback/info/text

Filter Selected → bg: action/primary  text: text/inverse  checkmark ✓
```

---

### Toggle

Pre-existing section on Atoms page. On/Off switch for settings.

---

### Badge

Pre-existing section on Atoms page. Status indicators.

---

### Avatar

Pre-existing section on Atoms page. Image · Initials · Icon fallback.

---

## Molecules

> Atoms combined to do one specific job.

### 1. Form Field

**= External label + Input atom + Helper text**

**Types:** Text · Amount · Mobile (+91) · UPI (Optional)
**Sizes:** MD · LG
**States:** Default · Focused · Filled · Error · Success · Disabled
**Total:** 48 variants

```
Structure:
  [Label row]   → "Field name *"  SemiBold labelFs  [Optional right-aligned]
  [Field]       → Input atom (Option A pattern)
  [Helper row]  → ● dot + helper text
```

**Label pattern:** Always external, never floating. Consistent with Razorpay/Cashfree B2B fintech.

---

### 2. Search Bar

**Types:** Inline · With Button
**Sizes:** MD (44px) · LG (52px)
**States:** Default · Focused · Active · Disabled
**Total:** 16 variants

```
Inline:      ⌕ icon + field + × clear (Active only)
With Button: ⌕ icon + field + × clear + [Search] button (brand bg)
Focused:     Chevron ↑, purple border + glow
Active:      Shows "HDFC Bank Terminal" value + × clear button
```

---

### 3. Toast / Notification

**Variants:** Success · Warning · Error · Info
**Content:** Compact · Detailed · With Action
**Total:** 12 variants

```
Layout: [left accent bar] [icon] [title  action link] [× close]
                                 [description below  ]

Accent bar colors:
  Success → feedback/success/text (green)
  Warning → feedback/warning/text (amber)
  Error   → feedback/error/text (red)
  Info    → feedback/info/text (blue)

Action link: right-aligned inline with title row, underlined SemiBold
```

---

### 4. Menu Item

**Trailing types:** None · Arrow (›) · Badge (count) · Toggle
**Sizes:** MD (48px) · LG (56px)
**States:** Default · Hover · Active · Disabled
**Total:** 32 variants

```
Active state:
  → bg: brand/50
  → Left bar: 3px, brand/500
  → Label + sublabel: text/brand

Toggle trailing:
  Default/Hover → gray (off)
  Active        → brand/500 (on)

Separator: 0.5px line starting from text column
```

---

### 5. List Item / Row

**Leading:** Avatar (initials circle) · Icon (rounded square)
**Trailing:** Amount + status · Status badge · Arrow · Timestamp + unread dot
**Sizes:** MD (64px) · LG (72px)
**States:** Default · Pressed · Disabled
**Total:** 48 variants

```
Avatar: initials in Inter Bold, brand/500 bg, circular
Icon:   rounded square, brand/500 @ 12% opacity bg + inner mark

Trailing Amount: green SemiBold (credit), tertiary sub-text
Trailing Status: pill badge (Completed/Pending/Failed)
Trailing Timestamp: tertiary Regular + brand/500 unread dot
```

---

### 6. Card

**Types:** Stat · Transaction · Merchant · Summary
**States:** Default · Hover · Disabled
**Total:** 12 variants

```
Hover treatment:
  → bg: brand/50 @ 60% opacity overlay
  → border: border/default (stronger)
  → shadow: 0 4px 16px rgba(0,0,0,0.12)
  NOT a heavy color fill — subtle elevation change only

Stat Card:    label + large Display amount + ↑% badge + sub-stats
Transaction:  avatar + merchant name (truncated) + amount + TXN ref + status
Merchant:     avatar + name + Active badge + volume stats + 2 equal buttons
Summary:      label/value table + total row + full-width CTA button
```

---

### 7. Navigation Tab

#### Tab Item
**Tabs:** Home · Transactions · Merchants · Terminals · Profile (RK avatar)
**States:** Default · Active · Disabled
**With/Without badge**
**Total:** 30 variants

```
Active state:
  → Pill (52×30px, radius: 15px) behind ICON ONLY — not label
  → Pill bg: brand/50
  → Icon color: action/primary
  → Label: SemiBold, action/primary
  → Label sits BELOW pill

Profile tab:
  → Avatar circle with "RK" initials (not a gear icon)
  → Active: brand/500 filled circle + 1.5px ring border
```

#### Nav Bar (full compositions)
**3-item** (Home · Transactions · Profile)
**4-item** (Home · Transactions · Merchants · Profile)
**5-item** (Home · Transactions · Merchants · Terminals · Profile)
**Total:** 12 nav bar variants (each active tab per group)

Built using **real Nav Tab Item instances** — changes to Tab Item propagate automatically.

---

### 8. Dropdown / Select

**Components:**
- `Dropdown Trigger` — 2 sizes × 5 states = 10 variants
- `Dropdown Option` — 2 sizes × 4 states = 8 variants
- `Dropdown Panel` — Closed · Open · With Selection = 3 variants

```
Trigger states: Default · Focused (chevron ↑) · Filled · Error · Disabled
Option states:  Default · Hover · Selected (✓ + left bar + brand/50 bg) · Disabled

Payment method options:
  UPI Payment · Credit / Debit Card · Net Banking · Cash on Delivery · BNPL
```

---

### 9. Radio Button

**States:** Unselected · Selected · Disabled
**Sizes:** SM · MD · LG
**Label:** Yes / No
**Total:** 18 variants

---

### 10. Tabs

#### Tab Items
- **Horizontal Tab** — bottom indicator bar on active
- **Pill Tab** — white card pill with shadow on active

#### Tab Bars (full compositions)
```
Horizontal: 4-tab (All/Completed/Pending/Failed), 3-tab (Today/This Week/This Month)
Pill/Segmented: 3-tab (Today/This Week/This Month) with sliding active pill
```

---

## Usage Rules

### Input fields — Option A (Smart Critique standard)
```
✓ External label always above — never floating inside field
✓ Placeholder gives format hint (e.g. "e.g. ₹ 1,50,000")
✓ Placeholder disappears on focus — cursor appears
✓ Value appears on Filled state
✗ Do NOT use floating label pattern (PhonePe style) — wrong for B2B fintech
```

### Hover states — Cards
```
✓ Subtle: brand/50 tint + stronger border + elevated shadow
✗ Never: heavy brand/500 color fill as hover — reads as a completely different component
```

### Navigation — Icon-only pill
```
✓ Pill selection indicator wraps ICON only (52×30px pill)
✓ Label sits below, always visible, outside the pill
✗ Never wrap both icon AND label in the pill
```

### Orange usage (if ever needed)
```
✓ Orange bg (#F37021) + dark text (#1A1A1A) → 7.35:1 AAA
✓ Dark orange (#C05A13) as text on white → 5.22:1 AA
✗ Never: orange text on white → 2.86:1 FAILS
✗ Never: white text on orange → 2.86:1 FAILS
```

---

## Accessibility

### WCAG Compliance

| Color pair | Ratio | Level | Usage |
|---|---|---|---|
| `#004A99` on white | **8.60:1** | **AAA** | All text, buttons, icons |
| White on `#004A99` | **8.60:1** | **AAA** | Button labels, CTAs |
| `#004A99` on brand/50 | **7.12:1** | **AAA** | Active states |
| `#004A99` on gray/100 | **7.80:1** | **AAA** | Ghost buttons |
| Error red on white | 5.9:1 | **AA** | Error text |
| Success green on white | 5.1:1 | **AA** | Success text |

### WCAG Requirements Met

| Criterion | Requirement | Status |
|---|---|---|
| 1.4.3 Contrast (Normal text) | 4.5:1 minimum | ✅ 8.60:1 |
| 1.4.3 Contrast (Large text) | 3:1 minimum | ✅ 8.60:1 |
| 1.4.11 Non-text contrast (UI) | 3:1 minimum | ✅ 8.60:1 |
| 2.4.7 Focus visible | Focus ring visible | ✅ brand/500 3px glow |
| 1.4.1 Use of color | Not color alone | ✅ Icons + labels used |

### Touch targets
All interactive atoms are minimum **44×44px** at MD size (WCAG 2.5.5).

---

## CSS Variables Reference

```css
:root {
  /* Brand */
  --color-brand-50:  #EBF2FC;
  --color-brand-100: #CFE1F5;
  --color-brand-200: #9DC3EC;
  --color-brand-300: #5A9ADE;
  --color-brand-400: #0C72E0;
  --color-brand-500: #004A99;   /* Primary */
  --color-brand-600: #003A7A;   /* Hover */
  --color-brand-700: #002B5C;   /* Pressed */
  --color-brand-800: #001D3D;
  --color-brand-900: #00101F;

  /* Semantic — Action */
  --color-action-primary:         #004A99;
  --color-action-primary-hover:   #003A7A;
  --color-action-primary-pressed: #002B5C;

  /* Semantic — Text */
  --color-text-primary:   #1A1A18;
  --color-text-secondary: #3D3D3B;
  --color-text-tertiary:  #757572;
  --color-text-disabled:  #B0AFAB;
  --color-text-inverse:   #FFFFFF;
  --color-text-brand:     #004A99;
  --color-text-danger:    #DC2626;
  --color-text-success:   #16A34A;
  --color-text-warning:   #D97706;

  /* Semantic — Border */
  --color-border-default: #E8E7E3;
  --color-border-subtle:  #F4F3F0;
  --color-border-strong:  #D1D0CC;
  --color-border-focus:   #004A99;
  --color-border-error:   #DC2626;
  --color-border-success: #16A34A;

  /* Semantic — Surface */
  --color-surface-page:    #FAFAFA;
  --color-surface-card:    #FFFFFF;
  --color-surface-sunken:  #F4F3F0;

  /* Feedback */
  --color-feedback-success-bg:     #F0FDF4;
  --color-feedback-success-text:   #16A34A;
  --color-feedback-warning-bg:     #FFFBEB;
  --color-feedback-warning-text:   #D97706;
  --color-feedback-error-bg:       #FEF2F2;
  --color-feedback-error-text:     #DC2626;
  --color-feedback-info-bg:        #EFF6FF;
  --color-feedback-info-text:      #2563EB;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Border Radius */
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   10px;
  --radius-2xl:  12px;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Inter', monospace;
}
```

---

## Component Status

| Component | Type | Variants | Status |
|---|---|---|---|
| Button | Atom | 90 | ✅ Done |
| Input Field | Atom | 84 | ✅ Done |
| OTP Input | Atom | 36 | ✅ Done |
| Textarea | Atom | 18 | ✅ Done |
| Checkbox | Atom | 36 | ✅ Done |
| Radio Button | Atom | 18 | ✅ Done |
| Tag / Chip | Atom | 39 | ✅ Done |
| Toggle | Atom | — | Pre-existing |
| Badge | Atom | — | Pre-existing |
| Avatar | Atom | — | Pre-existing |
| Form Field | Molecule | 48 | ✅ Done |
| Search Bar | Molecule | 16 | ✅ Done |
| Toast / Notification | Molecule | 12 | ✅ Done |
| Menu Item | Molecule | 32 | ✅ Done |
| List Item / Row | Molecule | 48 | ✅ Done |
| Card | Molecule | 12 | ✅ Done |
| Navigation Tab | Molecule | 30+12 | ✅ Done |
| Dropdown / Select | Molecule | 21 | ✅ Done |
| Tabs | Molecule | 22 | ✅ Done |

**Total variants: 583+**
**Total variable bindings: 3,900+**

---

*Smart Critique Design System · Figma MCP · Built by Venu*
