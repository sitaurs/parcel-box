# 📱 Responsive Breakpoints Quick Reference

## Device Sizes

### Mobile Phones
```
iPhone SE:        375 x 667px
iPhone 12/13/14:  390 x 844px
iPhone 14 Pro:    393 x 852px
Samsung Galaxy:   360 x 740px
Pixel 5:          393 x 851px
```

### Tablets
```
iPad Mini:        768 x 1024px
iPad:             810 x 1080px
iPad Air:         820 x 1180px
iPad Pro 11":     834 x 1194px
iPad Pro 12.9":   1024 x 1366px
```

### Desktops
```
Laptop (HD):      1366 x 768px
Desktop (FHD):    1920 x 1080px
Desktop (QHD):    2560 x 1440px
Desktop (4K):     3840 x 2160px
```

## Tailwind Breakpoints

```css
/* Default (Mobile First) */
.class { }                 /* 0px and up */

/* Small devices (landscape phones) */
sm: { }                    /* 640px and up */

/* Medium devices (tablets) */
md: { }                    /* 768px and up */

/* Large devices (desktops) */
lg: { }                    /* 1024px and up */

/* Extra large devices */
xl: { }                    /* 1280px and up */

/* 2X Extra large */
2xl: { }                   /* 1536px and up */
```

## Common Patterns

### Grid Columns
```tsx
// Gallery: 2 → 3 → 4 → 5 → 6 columns
className="grid 
  grid-cols-2 
  sm:grid-cols-3 
  md:grid-cols-4 
  lg:grid-cols-5 
  xl:grid-cols-6"

// Dashboard Cards: 1 → 2 → 4 columns
className="grid 
  grid-cols-1 
  sm:grid-cols-2 
  md:grid-cols-4"

// Packages: 1 → 2 → 3 columns
className="grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3"
```

### Padding
```tsx
// Scale up padding
p-4 md:p-6 lg:p-8 xl:p-10
// 16px → 24px → 32px → 40px
```

### Text Size
```tsx
// Headings
text-2xl md:text-3xl lg:text-4xl
// 24px → 30px → 36px

// Body
text-sm md:text-base lg:text-lg
// 14px → 16px → 18px
```

### Layout Shifts
```tsx
// Vertical on mobile, horizontal on desktop
flex-col md:flex-row

// Hidden on mobile, visible on tablet+
hidden md:block

// Full width on mobile, fixed on desktop
w-full lg:w-72
```

## Component Visibility

```tsx
// Mobile only
<div className="md:hidden">
  {/* Mobile Bottom Nav */}
</div>

// Tablet only
<div className="hidden md:block lg:hidden">
  {/* Tablet Top Bar */}
</div>

// Desktop only
<div className="hidden lg:block">
  {/* Desktop Sidebar */}
</div>

// Tablet and Desktop
<div className="hidden md:block">
  {/* Not on mobile */}
</div>
```

## Testing Commands

```bash
# Resize browser window to test
Mobile:   375px  (iPhone)
Tablet:   768px  (iPad)
Desktop:  1024px (Laptop)
Wide:     1920px (Full HD)

# Chrome DevTools
Ctrl+Shift+M  → Toggle device toolbar
Ctrl+Shift+I  → Open DevTools
```

## Pro Tips

### 1. Mobile First
Start with mobile styles, add larger screen styles

```tsx
// ✅ Good
className="text-sm md:text-base lg:text-lg"

// ❌ Bad  
className="lg:text-lg md:text-base text-sm"
```

### 2. Use max-width for content
```tsx
className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8"
```

### 3. Touch targets (minimum 44x44px)
```tsx
className="min-h-[44px] min-w-[44px]"
```

### 4. Responsive spacing
```tsx
// Gap between items
gap-3 md:gap-4 lg:gap-6

// Margins
mt-4 md:mt-6 lg:mt-8
```

### 5. Container queries (future)
```tsx
// Based on parent size, not viewport
@container (min-width: 400px) {
  .card { padding: 2rem; }
}
```

## Quick Checklist

- [ ] Test on 375px (mobile)
- [ ] Test on 768px (tablet)
- [ ] Test on 1024px (desktop)
- [ ] Test on 1920px (full HD)
- [ ] Check landscape orientation
- [ ] Verify touch targets
- [ ] Check text readability
- [ ] Test dark mode
- [ ] Verify images load
- [ ] Check horizontal scroll

## Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
- [Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
