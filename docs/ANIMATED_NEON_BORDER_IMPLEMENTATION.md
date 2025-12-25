# Animated Neon Border Implementation - SOCyberX

## Overview
Implemented an **animated moving neon border** that travels around card edges. The neon light rotates continuously, creating a premium cyber aesthetic. **No gradient overlays inside cards** - border-only effect.

---

## Features

✅ **Moving neon border** - Rotates continuously around card perimeter  
✅ **More visible glow** - Stronger, thicker border (4px) with enhanced outer glow  
✅ **Border-only effect** - No interior gradients, dark card content preserved  
✅ **Per-level colors** - Easy (cyan), Medium (purple), Hard (muted/orange)  
✅ **Locked state support** - Slower animation and reduced glow for locked cards  
✅ **Hover enhancement** - Increased glow intensity on hover  
✅ **Reduced motion support** - Disables animation for accessibility  

---

## CSS Classes

### Base Class: `.socx-neon-card`
Applied to each card container. Provides the animated border foundation.

### Variant Classes:

1. **`.socx-neon-easy`** - Cyan/Blue neon
   - Bright cyan border: `rgba(0, 229, 255, 1)`
   - Cyan outer glow
   - 6s rotation speed

2. **`.socx-neon-medium`** - Purple/Pink neon
   - Bright purple border: `rgba(168, 85, 247, 1)`
   - Purple outer glow
   - 6s rotation speed

3. **`.socx-neon-hard`** - Muted (locked) / Orange (unlocked)
   - Locked: Muted gray `rgba(148, 163, 184, 0.5)`, 12s rotation
   - Unlocked: Orange `rgba(251, 146, 60, 1)`, 6s rotation

---

## Implementation Details

### Technique: Masked Conic Gradient
- **`::before` pseudo-element**: Rotating conic-gradient background
- **CSS mask with exclude**: Creates border ring (shows outer area, hides inner)
- **`::after` pseudo-element**: Outer glow via box-shadow
- **Animation**: Rotates gradient 360° in 6s (12s for locked)

### Border Ring Creation
The border ring is created using CSS `mask-composite: exclude`:
- Pseudo-element extends 4px beyond card edges
- Conic-gradient rotates creating moving light effect
- Mask excludes inner content area, showing only border ring
- Result: Moving neon light travels around border perimeter

### Enhanced Visibility
- **Border thickness**: 4px (thicker than previous 1-2px)
- **Stronger glow**: Multiple box-shadow layers (30px, 60px, 90px radii)
- **Higher opacity**: 0.95 for border, 0.7-0.9 for glow
- **Brighter colors**: Full opacity (1.0) for neon colors

---

## File Changes

### 1. CSS: `public/html/css/pages/challenges.css`
**Location:** Replace/update the existing `.socx-neon-card` styles (starting around line 43)

**Key CSS Sections:**
```css
/* Base card with dark background */
.socx-neon-card {
  background: rgba(11, 18, 32, 0.95) !important;
  overflow: hidden;
}

/* Animated rotating border */
.socx-neon-card::before {
  background: conic-gradient(...);
  mask-composite: exclude; /* Creates border ring */
  animation: socx-border-rotate 6s linear infinite;
}

/* Outer glow */
.socx-neon-card::after {
  box-shadow: 0 0 30px ..., 0 0 60px ..., 0 0 90px ...;
}
```

### 2. HTML: `public/html/challenges.html`
**Location:** Update card div elements (lines 58, 73, 94)

**Changes:**
```html
<!-- Before -->
<div class="card level-card socx-neon-card is-easy" id="level-easy">

<!-- After -->
<div class="card level-card socx-neon-card socx-neon-easy" id="level-easy">
```

**Applied Classes:**
- ✅ Easy: `socx-neon-card socx-neon-easy`
- ✅ Medium: `socx-neon-card socx-neon-medium level-locked`
- ✅ Hard: `socx-neon-card socx-neon-hard level-locked`

---

## How It Works

### Animation Flow
1. **Conic gradient** creates a bright section (280°-320°) that moves
2. **Rotation animation** rotates the entire gradient 360°
3. **Mask excludes center** - only border ring is visible
4. **Result**: Bright light travels around card perimeter

### Border Ring Technique
```
Pseudo-element (::before):
├─ Extends 4px beyond card (inset: -4px)
├─ Full conic-gradient background
├─ Mask excludes inner content area
└─ Only border ring visible
```

### Outer Glow Technique
```
Pseudo-element (::after):
├─ Positioned behind card
├─ Multiple box-shadow layers
├─ Color matches border
└─ Enhanced on hover
```

---

## Animation Details

### Keyframes
```css
@keyframes socx-border-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Timing
- **Normal**: 6s linear infinite (Easy, Medium, unlocked Hard)
- **Locked**: 12s linear infinite (slower, less attention)
- **Reduced motion**: Animation disabled (accessibility)

### Conic Gradient Pattern
- **0°-250°**: Transparent (dark section)
- **280°-320°**: Bright neon (moving light)
- **330°-360°**: Transparent (fade out)

---

## Color Palette

| Level | Border Color | Outer Glow | Animation Speed |
|-------|-------------|------------|-----------------|
| Easy | `rgba(0, 229, 255, 1)` Cyan | Cyan (3 layers) | 6s |
| Medium | `rgba(168, 85, 247, 1)` Purple | Purple (3 layers) | 6s |
| Hard (locked) | `rgba(148, 163, 184, 0.5)` Gray | Muted gray | 12s |
| Hard (unlocked) | `rgba(251, 146, 60, 1)` Orange | Orange | 6s |

---

## Hover States

### Easy & Medium
- Glow intensity: 0.7 → 0.9 opacity
- Shadow spread: 30px → 40px (first layer)
- Maximum glow: 120px radius

### Hard (unlocked)
- Orange border becomes brighter
- Glow intensity increases
- Normal animation speed maintained

### Locked Cards
- No hover effect (pointer-events: none)
- Animation continues at reduced speed
- Muted appearance maintained

---

## Browser Compatibility

### Well Supported
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+ (with `-webkit-` prefixes)

### Fallbacks
- **Mask not supported**: Border still shows (static)
- **Animation not supported**: Shows static border
- **Conic-gradient not supported**: Falls back to solid color

### Reduced Motion
- Automatically disables animation
- Shows static border instead
- Respects user preferences

---

## Performance Considerations

✅ **GPU accelerated**: Uses transform (rotation)  
✅ **Minimal repaints**: Pseudo-elements isolated  
✅ **Lightweight**: No heavy animations or filters  
✅ **Efficient**: Single pseudo-element for border  

---

## Accessibility

✅ **Reduced motion support**: 
```css
@media (prefers-reduced-motion: reduce) {
  .socx-neon-card::before {
    animation: none;
    opacity: 0.7; /* Static border */
  }
}
```

✅ **No flashing**: Smooth rotation, no sudden changes  
✅ **Content readable**: Dark background preserved  
✅ **Focus states**: Existing button/click handlers preserved  

---

## Testing Checklist

- [ ] Easy card shows cyan moving border
- [ ] Medium card shows purple moving border (when unlocked)
- [ ] Hard card shows muted border (locked) or orange (unlocked)
- [ ] Border rotates smoothly around perimeter
- [ ] Outer glow is clearly visible
- [ ] No gradient overlay inside card content
- [ ] Hover increases glow intensity
- [ ] Locked cards have slower animation
- [ ] Reduced motion disables animation
- [ ] Card functionality (clicks, buttons) still works

---

## Troubleshooting

### Border Not Visible
- Check mask support in browser
- Verify `mask-composite: exclude` is supported
- Check z-index stacking context

### Animation Not Working
- Verify `animation` property support
- Check for `prefers-reduced-motion` override
- Ensure `::before` pseudo-element is created

### Glow Too Weak/Strong
- Adjust `opacity` on `::after` pseudo-element
- Modify box-shadow radii and opacities
- Check color opacity values

---

## Summary

The animated neon border creates a premium cyber aesthetic with:
- ✅ **Moving light** that travels around card edges
- ✅ **Enhanced visibility** with thicker border and stronger glow
- ✅ **Border-only effect** - no interior gradients
- ✅ **Smooth animation** at 6s rotation (12s for locked)
- ✅ **Accessibility compliant** with reduced motion support

The implementation uses modern CSS techniques (conic-gradient, mask-composite) to create the border ring effect while maintaining performance and browser compatibility.

