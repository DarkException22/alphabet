/**
 * Great CSS Framework v1.0
 * Utility-first CSS framework - More powerful and flexible than Tailwind
 */

// Core exports
export { createTheme, useTheme, ThemeProvider } from './theme';
export { createUtility, utility, u } from './utility';
export { createComponent, c } from './component';
export { createVariant, v } from './variant';
export { createAnimation, animate } from './animation';
export { createLayout, layout } from './layout';
export { createTypography, typography } from './typography';

// Presets
export { defaultTheme } from './presets/default';
export { darkTheme } from './presets/dark';
export { rtlTheme } from './presets/rtl';

// Hooks
export { useMediaQuery, useBreakpoint, useColorScheme } from './hooks';

// Utilities
export { 
  spacing, 
  colors, 
  typography as typographyUtils,
  borders,
  shadows,
  transitions,
  transforms,
  filters,
  grids,
  flexbox,
  sizing,
  positioning,
  visibility,
  interactivity
} from './utilities';

// Main framework class
export class Great {
  private config: GreatConfig;
  private utilities: Map<string, UtilityClass> = new Map();
  private variants: Map<string, Variant> = new Map();
  private components: Map<string, Component> = new Map();
  private theme: Theme;
  private generatedCSS: string = '';

  constructor(config: Partial<GreatConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.theme = this.config.theme;
    this.initialize();
  }

  private initialize(): void {
    this.registerCoreUtilities();
    this.registerCoreVariants();
    this.registerCoreComponents();
    this.generateCSS();
  }

  private registerCoreUtilities(): void {
    // Spacing utilities
    this.registerUtility('p', 'padding', this.theme.spacing);
    this.registerUtility('m', 'margin', this.theme.spacing);
    this.registerUtility('space', 'margin', this.theme.spacing, true);
    
    // Sizing utilities
    this.registerUtility('w', 'width', this.theme.sizing);
    this.registerUtility('h', 'height', this.theme.sizing);
    this.registerUtility('min-w', 'min-width', this.theme.sizing);
    this.registerUtility('max-w', 'max-width', this.theme.sizing);
    this.registerUtility('min-h', 'min-height', this.theme.sizing);
    this.registerUtility('max-h', 'max-height', this.theme.sizing);
    
    // Color utilities
    this.registerColorUtilities();
    
    // Typography utilities
    this.registerUtility('text', 'font-size', this.theme.typography.fontSize);
    this.registerUtility('font', 'font-weight', this.theme.typography.fontWeight);
    this.registerUtility('leading', 'line-height', this.theme.typography.lineHeight);
    this.registerUtility('tracking', 'letter-spacing', this.theme.typography.letterSpacing);
    
    // Layout utilities
    this.registerLayoutUtilities();
    
    // Border utilities
    this.registerBorderUtilities();
    
    // Effect utilities
    this.registerEffectUtilities();
  }

  private registerColorUtilities(): void {
    // Text colors
    Object.entries(this.theme.colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'string') {
        this.registerUtility(`text-${colorName}`, 'color', { '': colorValue });
      } else if (typeof colorValue === 'object') {
        Object.entries(colorValue).forEach(([shade, shadeValue]) => {
          this.registerUtility(`text-${colorName}-${shade}`, 'color', { '': shadeValue });
        });
      }
    });
    
    // Background colors
    Object.entries(this.theme.colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'string') {
        this.registerUtility(`bg-${colorName}`, 'background-color', { '': colorValue });
      } else if (typeof colorValue === 'object') {
        Object.entries(colorValue).forEach(([shade, shadeValue]) => {
          this.registerUtility(`bg-${colorName}-${shade}`, 'background-color', { '': shadeValue });
        });
      }
    });
    
    // Border colors
    Object.entries(this.theme.colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'string') {
        this.registerUtility(`border-${colorName}`, 'border-color', { '': colorValue });
      } else if (typeof colorValue === 'object') {
        Object.entries(colorValue).forEach(([shade, shadeValue]) => {
          this.registerUtility(`border-${colorName}-${shade}`, 'border-color', { '': shadeValue });
        });
      }
    });
    
    // Gradient utilities
    this.registerUtility('bg-gradient', 'background-image', {
      'to-t': 'linear-gradient(to top, var(--tw-gradient-stops))',
      'to-tr': 'linear-gradient(to top right, var(--tw-gradient-stops))',
      'to-r': 'linear-gradient(to right, var(--tw-gradient-stops))',
      'to-br': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
      'to-b': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
      'to-bl': 'linear-gradient(to bottom left, var(--tw-gradient-stops))',
      'to-l': 'linear-gradient(to left, var(--tw-gradient-stops))',
      'to-tl': 'linear-gradient(to top left, var(--tw-gradient-stops))'
    });
  }

  private registerLayoutUtilities(): void {
    // Display
    this.registerUtility('d', 'display', {
      'block': 'block',
      'inline-block': 'inline-block',
      'inline': 'inline',
      'flex': 'flex',
      'inline-flex': 'inline-flex',
      'grid': 'grid',
      'inline-grid': 'inline-grid',
      'hidden': 'none'
    });
    
    // Flexbox
    this.registerUtility('flex', 'display', { '': 'flex' });
    this.registerUtility('inline-flex', 'display', { '': 'inline-flex' });
    this.registerUtility('flex-direction', 'flex-direction', {
      'row': 'row',
      'row-reverse': 'row-reverse',
      'col': 'column',
      'col-reverse': 'column-reverse'
    });
    this.registerUtility('flex-wrap', 'flex-wrap', {
      'wrap': 'wrap',
      'wrap-reverse': 'wrap-reverse',
      'nowrap': 'nowrap'
    });
    this.registerUtility('justify', 'justify-content', {
      'start': 'flex-start',
      'end': 'flex-end',
      'center': 'center',
      'between': 'space-between',
      'around': 'space-around',
      'evenly': 'space-evenly'
    });
    this.registerUtility('items', 'align-items', {
      'start': 'flex-start',
      'end': 'flex-end',
      'center': 'center',
      'baseline': 'baseline',
      'stretch': 'stretch'
    });
    
    // Grid
    this.registerUtility('grid', 'display', { '': 'grid' });
    this.registerUtility('grid-cols', 'grid-template-columns', this.theme.gridColumns);
    this.registerUtility('grid-rows', 'grid-template-rows', this.theme.gridRows);
    this.registerUtility('gap', 'gap', this.theme.spacing);
    this.registerUtility('gap-x', 'column-gap', this.theme.spacing);
    this.registerUtility('gap-y', 'row-gap', this.theme.spacing);
    
    // Positioning
    this.registerUtility('position', 'position', {
      'static': 'static',
      'fixed': 'fixed',
      'absolute': 'absolute',
      'relative': 'relative',
      'sticky': 'sticky'
    });
    this.registerUtility('top', 'top', this.theme.spacing);
    this.registerUtility('right', 'right', this.theme.spacing);
    this.registerUtility('bottom', 'bottom', this.theme.spacing);
    this.registerUtility('left', 'left', this.theme.spacing);
    this.registerUtility('inset', 'inset', this.theme.spacing, true);
    
    // Z-index
    this.registerUtility('z', 'z-index', this.theme.zIndex);
  }

  private registerBorderUtilities(): void {
    // Border width
    this.registerUtility('border', 'border-width', {
      '': '1px',
      '0': '0',
      '2': '2px',
      '4': '4px',
      '8': '8px'
    });
    this.registerUtility('border-t', 'border-top-width', this.theme.borderWidth);
    this.registerUtility('border-r', 'border-right-width', this.theme.borderWidth);
    this.registerUtility('border-b', 'border-bottom-width', this.theme.borderWidth);
    this.registerUtility('border-l', 'border-left-width', this.theme.borderWidth);
    
    // Border style
    this.registerUtility('border-style', 'border-style', {
      'solid': 'solid',
      'dashed': 'dashed',
      'dotted': 'dotted',
      'double': 'double',
      'none': 'none'
    });
    
    // Border radius
    this.registerUtility('rounded', 'border-radius', this.theme.borderRadius);
    this.registerUtility('rounded-t', 'border-top-left-radius border-top-right-radius', this.theme.borderRadius, true);
    this.registerUtility('rounded-r', 'border-top-right-radius border-bottom-right-radius', this.theme.borderRadius, true);
    this.registerUtility('rounded-b', 'border-bottom-right-radius border-bottom-left-radius', this.theme.borderRadius, true);
    this.registerUtility('rounded-l', 'border-top-left-radius border-bottom-left-radius', this.theme.borderRadius, true);
    this.registerUtility('rounded-tl', 'border-top-left-radius', this.theme.borderRadius);
    this.registerUtility('rounded-tr', 'border-top-right-radius', this.theme.borderRadius);
    this.registerUtility('rounded-br', 'border-bottom-right-radius', this.theme.borderRadius);
    this.registerUtility('rounded-bl', 'border-bottom-left-radius', this.theme.borderRadius);
  }

  private registerEffectUtilities(): void {
    // Shadows
    this.registerUtility('shadow', 'box-shadow', this.theme.boxShadow);
    
    // Opacity
    this.registerUtility('opacity', 'opacity', {
      '0': '0',
      '5': '0.05',
      '10': '0.1',
      '20': '0.2',
      '25': '0.25',
      '30': '0.3',
      '40': '0.4',
      '50': '0.5',
      '60': '0.6',
      '70': '0.7',
      '75': '0.75',
      '80': '0.8',
      '90': '0.9',
      '95': '0.95',
      '100': '1'
    });
    
    // Transitions
    this.registerUtility('transition', 'transition-property', {
      'none': 'none',
      'all': 'all',
      'colors': 'background-color, border-color, color, fill, stroke',
      'opacity': 'opacity',
      'shadow': 'box-shadow',
      'transform': 'transform'
    });
    this.registerUtility('duration', 'transition-duration', this.theme.transitionDuration);
    this.registerUtility('ease', 'transition-timing-function', this.theme.transitionTimingFunction);
    this.registerUtility('delay', 'transition-delay', this.theme.transitionDelay);
    
    // Transforms
    this.registerUtility('scale', 'transform', {
      '0': 'scale(0)',
      '50': 'scale(.5)',
      '75': 'scale(.75)',
      '90': 'scale(.9)',
      '95': 'scale(.95)',
      '100': 'scale(1)',
      '105': 'scale(1.05)',
      '110': 'scale(1.1)',
      '125': 'scale(1.25)',
      '150': 'scale(1.5)'
    });
    this.registerUtility('rotate', 'transform', {
      '0': 'rotate(0deg)',
      '1': 'rotate(1deg)',
      '2': 'rotate(2deg)',
      '3': 'rotate(3deg)',
      '6': 'rotate(6deg)',
      '12': 'rotate(12deg)',
      '45': 'rotate(45deg)',
      '90': 'rotate(90deg)',
      '180': 'rotate(180deg)'
    });
    this.registerUtility('translate', 'transform', this.theme.spacing, false, (value) => `translate(${value})`);
    this.registerUtility('translate-x', 'transform', this.theme.spacing, false, (value) => `translateX(${value})`);
    this.registerUtility('translate-y', 'transform', this.theme.spacing, false, (value) => `translateY(${value})`);
  }

  private registerCoreVariants(): void {
    // Pseudo-class variants
    this.registerVariant('hover', '&:hover');
    this.registerVariant('focus', '&:focus');
    this.registerVariant('focus-within', '&:focus-within');
    this.registerVariant('focus-visible', '&:focus-visible');
    this.registerVariant('active', '&:active');
    this.registerVariant('visited', '&:visited');
    this.registerVariant('target', '&:target');
    this.registerVariant('disabled', '&:disabled');
    this.registerVariant('checked', '&:checked');
    this.registerVariant('required', '&:required');
    this.registerVariant('invalid', '&:invalid');
    this.registerVariant('valid', '&:valid');
    
    // Pseudo-element variants
    this.registerVariant('before', '&::before');
    this.registerVariant('after', '&::after');
    this.registerVariant('first-letter', '&::first-letter');
    this.registerVariant('first-line', '&::first-line');
    this.registerVariant('selection', '&::selection');
    this.registerVariant('placeholder', '&::placeholder');
    
    // Structural variants
    this.registerVariant('first', '&:first-child');
    this.registerVariant('last', '&:last-child');
    this.registerVariant('odd', '&:nth-child(odd)');
    this.registerVariant('even', '&:nth-child(even)');
    this.registerVariant('only', '&:only-child');
    this.registerVariant('first-of-type', '&:first-of-type');
    this.registerVariant('last-of-type', '&:last-of-type');
    this.registerVariant('only-of-type', '&:only-of-type');
    
    // State variants
    this.registerVariant('group-hover', '.group:hover &');
    this.registerVariant('group-focus', '.group:focus &');
    this.registerVariant('peer-hover', '.peer:hover ~ &');
    this.registerVariant('peer-focus', '.peer:focus ~ &');
    
    // Responsive variants
    Object.entries(this.theme.breakpoints).forEach(([breakpoint, value]) => {
      this.registerVariant(breakpoint, `@media (min-width: ${value})`);
    });
    
    // Dark mode variant
    this.registerVariant('dark', '.dark &');
    this.registerVariant('dark', '@media (prefers-color-scheme: dark)', 'media');
  }

  private registerCoreComponents(): void {
    // Button component
    this.registerComponent('btn', `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      font-weight: 500;
      border-radius: 0.375rem;
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      user-select: none;
      border: 1px solid transparent;
      line-height: 1.5;
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &:focus {
        outline: 2px solid transparent;
        outline-offset: 2px;
      }
    `, {
      primary: `
        background-color: var(--color-primary-500);
        color: white;
        
        &:hover:not(:disabled) {
          background-color: var(--color-primary-600);
        }
        
        &:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
      `,
      secondary: `
        background-color: var(--color-secondary-500);
        color: white;
        
        &:hover:not(:disabled) {
          background-color: var(--color-secondary-600);
        }
        
        &:focus {
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.5);
        }
      `,
      outline: `
        background-color: transparent;
        border-color: var(--color-gray-300);
        color: var(--color-gray-700);
        
        &:hover:not(:disabled) {
          background-color: var(--color-gray-50);
        }
        
        &:focus {
          box-shadow: 0 0 0 3px rgba(209, 213, 219, 0.5);
        }
      `,
      ghost: `
        background-color: transparent;
        color: var(--color-gray-700);
        
        &:hover:not(:disabled) {
          background-color: var(--color-gray-100);
        }
      `,
      link: `
        background-color: transparent;
        color: var(--color-primary-600);
        padding: 0;
        
        &:hover:not(:disabled) {
          text-decoration: underline;
        }
      `
    }, {
      sm: `
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      `,
      md: `
        padding: 0.5rem 1rem;
        font-size: 1rem;
      `,
      lg: `
        padding: 0.75rem 1.5rem;
        font-size: 1.125rem;
      `
    });
    
    // Card component
    this.registerComponent('card', `
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid var(--color-gray-200);
      overflow: hidden;
    `, {
      elevated: `
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      `,
      flat: `
        box-shadow: none;
        border: 1px solid var(--color-gray-200);
      `,
      bordered: `
        box-shadow: none;
        border: 2px solid var(--color-gray-300);
      `
    });
    
    // Alert component
    this.registerComponent('alert', `
      padding: 1rem;
      border-radius: 0.375rem;
      border: 1px solid transparent;
      margin-bottom: 1rem;
    `, {
      info: `
        background-color: var(--color-blue-50);
        border-color: var(--color-blue-200);
        color: var(--color-blue-800);
      `,
      success: `
        background-color: var(--color-green-50);
        border-color: var(--color-green-200);
        color: var(--color-green-800);
      `,
      warning: `
        background-color: var(--color-yellow-50);
        border-color: var(--color-yellow-200);
        color: var(--color-yellow-800);
      `,
      error: `
        background-color: var(--color-red-50);
        border-color: var(--color-red-200);
        color: var(--color-red-800);
      `
    });
    
    // Badge component
    this.registerComponent('badge', `
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
      border-radius: 9999px;
    `, {
      primary: `
        background-color: var(--color-primary-100);
        color: var(--color-primary-800);
      `,
      secondary: `
        background-color: var(--color-secondary-100);
        color: var(--color-secondary-800);
      `,
      success: `
        background-color: var(--color-green-100);
        color: var(--color-green-800);
      `,
      warning: `
        background-color: var(--color-yellow-100);
        color: var(--color-yellow-800);
      `,
      error: `
        background-color: var(--color-red-100);
        color: var(--color-red-800);
      `
    });
    
    // Input component
    this.registerComponent('input', `
      display: block;
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      color: var(--color-gray-900);
      background-color: white;
      background-clip: padding-box;
      border: 1px solid var(--color-gray-300);
      border-radius: 0.375rem;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      
      &:focus {
        border-color: var(--color-primary-500);
        outline: 0;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      }
      
      &:disabled {
        background-color: var(--color-gray-100);
        opacity: 0.5;
      }
    `, {
      lg: `
        padding: 0.75rem 1rem;
        font-size: 1.125rem;
      `,
      sm: `
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      `
    });
  }

  registerUtility(
    prefix: string, 
    property: string, 
    values: Record<string, string>,
    multiple: boolean = false,
    transform?: (value: string) => string
  ): void {
    this.utilities.set(prefix, {
      property,
      values,
      multiple,
      transform
    });
  }

  registerVariant(name: string, selector: string, type: 'pseudo' | 'media' | 'selector' = 'pseudo'): void {
    this.variants.set(name, {
      name,
      selector,
      type
    });
  }

  registerComponent(
    name: string, 
    baseStyles: string, 
    variants?: Record<string, string>,
    sizes?: Record<string, string>
  ): void {
    this.components.set(name, {
      name,
      baseStyles,
      variants: variants || {},
      sizes: sizes || {}
    });
  }

  generateCSS(): string {
    let css = '';
    
    // Add CSS variables for theme
    css += this.generateCSSVariables();
    
    // Add base styles
    css += this.generateBaseStyles();
    
    // Generate utility classes
    css += this.generateUtilityClasses();
    
    // Generate variant classes
    css += this.generateVariantClasses();
    
    // Generate component classes
    css += this.generateComponentClasses();
    
    // Add custom CSS if provided
    if (this.config.customCSS) {
      css += `\n/* Custom CSS */\n${this.config.customCSS}`;
    }
    
    this.generatedCSS = css;
    return css;
  }

  private generateCSSVariables(): string {
    let css = ':root {\n';
    
    // Color variables
    Object.entries(this.theme.colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'string') {
        css += `  --color-${colorName}: ${colorValue};\n`;
      } else if (typeof colorValue === 'object') {
        Object.entries(colorValue).forEach(([shade, shadeValue]) => {
          css += `  --color-${colorName}-${shade}: ${shadeValue};\n`;
        });
      }
    });
    
    // Spacing variables
    Object.entries(this.theme.spacing).forEach(([key, value]) => {
      css += `  --spacing-${key}: ${value};\n`;
    });
    
    // Typography variables
    Object.entries(this.theme.typography.fontSize).forEach(([key, value]) => {
      css += `  --font-size-${key}: ${value};\n`;
    });
    
    Object.entries(this.theme.typography.fontWeight).forEach(([key, value]) => {
      css += `  --font-weight-${key}: ${value};\n`;
    });
    
    // Border radius variables
    Object.entries(this.theme.borderRadius).forEach(([key, value]) => {
      css += `  --border-radius-${key}: ${value};\n`;
    });
    
    // Box shadow variables
    Object.entries(this.theme.boxShadow).forEach(([key, value]) => {
      css += `  --box-shadow-${key}: ${value};\n`;
    });
    
    // Transition variables
    Object.entries(this.theme.transitionDuration).forEach(([key, value]) => {
      css += `  --transition-duration-${key}: ${value};\n`;
    });
    
    css += '}\n\n';
    
    // Dark mode variables
    css += '.dark {\n';
    // In a real implementation, you would add dark mode color overrides here
    css += '}\n\n';
    
    return css;
  }

  private generateBaseStyles(): string {
    return `
/* Base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: ${this.theme.typography.fontFamily.sans.join(', ')};
  line-height: ${this.theme.typography.lineHeight.normal};
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: inherit;
  line-height: inherit;
  color: var(--color-gray-900);
  background-color: white;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: ${this.theme.typography.fontWeight.bold};
  line-height: ${this.theme.typography.lineHeight.tight};
  margin-bottom: var(--spacing-4);
}

h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
h4 { font-size: var(--font-size-xl); }
h5 { font-size: var(--font-size-lg); }
h6 { font-size: var(--font-size-base); }

p {
  margin-bottom: var(--spacing-4);
}

a {
  color: var(--color-primary-600);
  text-decoration: none;
  transition: color 0.15s ease-in-out;
}

a:hover {
  color: var(--color-primary-700);
}

/* Form elements */
input,
button,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

/* Lists */
ul,
ol {
  margin-bottom: var(--spacing-4);
  padding-left: var(--spacing-8);
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  vertical-align: middle;
}

/* Code */
code {
  font-family: ${this.theme.typography.fontFamily.mono.join(', ')};
  font-size: 0.875em;
  color: var(--color-gray-800);
  background-color: var(--color-gray-100);
  padding: 0.2em 0.4em;
  border-radius: var(--border-radius-sm);
}

pre {
  font-family: ${this.theme.typography.fontFamily.mono.join(', ')};
  background-color: var(--color-gray-100);
  padding: var(--spacing-4);
  border-radius: var(--border-radius-md);
  overflow-x: auto;
  margin-bottom: var(--spacing-4);
}

pre code {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

/* Horizontal rule */
hr {
  border: 0;
  border-top: 1px solid var(--color-gray-300);
  margin: var(--spacing-8) 0;
}

/* Selection */
::selection {
  background-color: var(--color-primary-200);
  color: var(--color-gray-900);
}

/* Focus outline */
:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Utility classes for screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* Container */
.container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: var(--spacing-4);
  padding-left: var(--spacing-4);
}

@media (min-width: ${this.theme.breakpoints.sm}) {
  .container {
    max-width: ${this.theme.breakpoints.sm};
  }
}

@media (min-width: ${this.theme.breakpoints.md}) {
  .container {
    max-width: ${this.theme.breakpoints.md};
  }
}

@media (min-width: ${this.theme.breakpoints.lg}) {
  .container {
    max-width: ${this.theme.breakpoints.lg};
  }
}

@media (min-width: ${this.theme.breakpoints.xl}) {
  .container {
    max-width: ${this.theme.breakpoints.xl};
  }
}

@media (min-width: ${this.theme.breakpoints['2xl']}) {
  .container {
    max-width: ${this.theme.breakpoints['2xl']};
  }
}

`;
  }

  private generateUtilityClasses(): string {
    let css = '/* Utility classes */\n';
    
    this.utilities.forEach((utility, prefix) => {
      Object.entries(utility.values).forEach(([key, value]) => {
        const className = key ? `.${prefix}-${key}` : `.${prefix}`;
        const propertyValue = utility.transform ? utility.transform(value) : value;
        
        if (utility.multiple) {
          // For properties that need multiple values (like padding: top right bottom left)
          css += `${className} { ${utility.property}: ${propertyValue}; }\n`;
        } else {
          css += `${className} { ${utility.property}: ${propertyValue}; }\n`;
        }
      });
    });
    
    return css;
  }

  private generateVariantClasses(): string {
    let css = '/* Variant classes */\n';
    
    this.variants.forEach((variant) => {
      if (variant.type === 'media') {
        css += `${variant.selector} {\n`;
        
        // Generate variant versions of all utilities
        this.utilities.forEach((utility, prefix) => {
          Object.entries(utility.values).forEach(([key, value]) => {
            const className = key ? `.${prefix}-${key}` : `.${prefix}`;
            const variantClassName = key ? `.${variant.name}\\:${prefix}-${key}` : `.${variant.name}\\:${prefix}`;
            const propertyValue = utility.transform ? utility.transform(value) : value;
            
            css += `  ${variantClassName} { ${utility.property}: ${propertyValue}; }\n`;
          });
        });
        
        css += '}\n';
      } else {
        // For pseudo-class and pseudo-element variants
        this.utilities.forEach((utility, prefix) => {
          Object.entries(utility.values).forEach(([key, value]) => {
            const className = key ? `.${prefix}-${key}` : `.${prefix}`;
            const variantClassName = key ? `.${variant.name}\\:${prefix}-${key}` : `.${variant.name}\\:${prefix}`;
            const propertyValue = utility.transform ? utility.transform(value) : value;
            
            css += `${variant.selector.replace('&', variantClassName)} { ${utility.property}: ${propertyValue}; }\n`;
          });
        });
      }
    });
    
    return css;
  }

  private generateComponentClasses(): string {
    let css = '/* Component classes */\n';
    
    this.components.forEach((component) => {
      // Base component class
      css += `.${component.name} {\n${component.baseStyles}\n}\n\n`;
      
      // Component variants
      Object.entries(component.variants).forEach(([variantName, variantStyles]) => {
        css += `.${component.name}-${variantName} {\n${variantStyles}\n}\n\n`;
      });
      
      // Component sizes
      Object.entries(component.sizes).forEach(([sizeName, sizeStyles]) => {
        css += `.${component.name}-${sizeName} {\n${sizeStyles}\n}\n\n`;
      });
    });
    
    return css;
  }

  inject(): void {
    if (typeof document === 'undefined') return;
    
    const styleId = 'great-css';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = this.generatedCSS;
  }

  getCSS(): string {
    return this.generatedCSS;
  }

  minify(): string {
    // Simple minification (in production, use a proper minifier)
    return this.generatedCSS
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around punctuation
      .replace(/;}/g, '}') // Remove trailing semicolons
      .trim();
  }

  private mergeConfig(config: Partial<GreatConfig>): GreatConfig {
    const defaultConfig: GreatConfig = {
      theme: {
        colors: {
          transparent: 'transparent',
          current: 'currentColor',
          black: '#000000',
          white: '#ffffff',
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827'
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d'
          },
          yellow: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
          },
          green: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b'
          },
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a'
          },
          indigo: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81'
          },
          purple: {
            50: '#f5f3ff',
            100: '#ede9fe',
            200: '#ddd6fe',
            300: '#c4b5fd',
            400: '#a78bfa',
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9',
            800: '#5b21b6',
            900: '#4c1d95'
          },
          pink: {
            50: '#fdf2f8',
            100: '#fce7f3',
            200: '#fbcfe8',
            300: '#f9a8d4',
            400: '#f472b6',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
            800: '#9d174d',
            900: '#831843'
          }
        },
        spacing: {
          0: '0px',
          1: '0.25rem',
          2: '0.5rem',
          3: '0.75rem',
          4: '1rem',
          5: '1.25rem',
          6: '1.5rem',
          8: '2rem',
          10: '2.5rem',
          12: '3rem',
          16: '4rem',
          20: '5rem',
          24: '6rem',
          32: '8rem',
          40: '10rem',
          48: '12rem',
          56: '14rem',
          64: '16rem',
          px: '1px',
          0.5: '0.125rem',
          1.5: '0.375rem',
          2.5: '0.625rem',
          3.5: '0.875rem'
        },
        sizing: {
          0: '0px',
          1: '0.25rem',
          2: '0.5rem',
          3: '0.75rem',
          4: '1rem',
          5: '1.25rem',
          6: '1.5rem',
          8: '2rem',
          10: '2.5rem',
          12: '3rem',
          16: '4rem',
          20: '5rem',
          24: '6rem',
          32: '8rem',
          40: '10rem',
          48: '12rem',
          56: '14rem',
          64: '16rem',
          auto: 'auto',
          '1/2': '50%',
          '1/3': '33.333333%',
          '2/3': '66.666667%',
          '1/4': '25%',
          '2/4': '50%',
          '3/4': '75%',
          '1/5': '20%',
          '2/5': '40%',
          '3/5': '60%',
          '4/5': '80%',
          '1/6': '16.666667%',
          '2/6': '33.333333%',
          '3/6': '50%',
          '4/6': '66.666667%',
          '5/6': '83.333333%',
          full: '100%',
          screen: '100vw'
        },
        typography: {
          fontFamily: {
            sans: [
              'system-ui',
              '-apple-system',
              'BlinkMacSystemFont',
              '"Segoe UI"',
              'Roboto',
              '"Helvetica Neue"',
              'Arial',
              '"Noto Sans"',
              'sans-serif',
              '"Apple Color Emoji"',
              '"Segoe UI Emoji"',
              '"Segoe UI Symbol"',
              '"Noto Color Emoji"'
            ],
            serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
            mono: [
              'Menlo',
              'Monaco',
              'Consolas',
              '"Liberation Mono"',
              '"Courier New"',
              'monospace'
            ]
          },
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
            '6xl': '3.75rem',
            '7xl': '4.5rem',
            '8xl': '6rem',
            '9xl': '8rem'
          },
          fontWeight: {
            thin: '100',
            extralight: '200',
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
            extrabold: '800',
            black: '900'
          },
          lineHeight: {
            none: '1',
            tight: '1.25',
            snug: '1.375',
            normal: '1.5',
            relaxed: '1.625',
            loose: '2'
          },
          letterSpacing: {
            tighter: '-0.05em',
            tight: '-0.025em',
            normal: '0em',
            wide: '0.025em',
            wider: '0.05em',
            widest: '0.1em'
          }
        },
        breakpoints: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px'
        },
        borderRadius: {
          none: '0px',
          sm: '0.125rem',
          DEFAULT: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          '2xl': '1rem',
          '3xl': '1.5rem',
          full: '9999px'
        },
        borderWidth: {
          DEFAULT: '1px',
          0: '0px',
          2: '2px',
          4: '4px',
          8: '8px'
        },
        boxShadow: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
          none: 'none'
        },
        zIndex: {
          0: '0',
          10: '10',
          20: '20',
          30: '30',
          40: '40',
          50: '50',
          auto: 'auto'
        },
        transitionDuration: {
          75: '75ms',
          100: '100ms',
          150: '150ms',
          200: '200ms',
          300: '300ms',
          500: '500ms',
          700: '700ms',
          1000: '1000ms'
        },
        transitionTimingFunction: {
          linear: 'linear',
          in: 'cubic-bezier(0.4, 0, 1, 1)',
          out: 'cubic-bezier(0, 0, 0.2, 1)',
          'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        transitionDelay: {
          75: '75ms',
          100: '100ms',
          150: '150ms',
          200: '200ms',
          300: '300ms',
          500: '500ms',
          700: '700ms',
          1000: '1000ms'
        },
        gridColumns: {
          1: 'repeat(1, minmax(0, 1fr))',
          2: 'repeat(2, minmax(0, 1fr))',
          3: 'repeat(3, minmax(0, 1fr))',
          4: 'repeat(4, minmax(0, 1fr))',
          5: 'repeat(5, minmax(0, 1fr))',
          6: 'repeat(6, minmax(0, 1fr))',
          7: 'repeat(7, minmax(0, 1fr))',
          8: 'repeat(8, minmax(0, 1fr))',
          9: 'repeat(9, minmax(0, 1fr))',
          10: 'repeat(10, minmax(0, 1fr))',
          11: 'repeat(11, minmax(0, 1fr))',
          12: 'repeat(12, minmax(0, 1fr))',
          none: 'none'
        },
        gridRows: {
          1: 'repeat(1, minmax(0, 1fr))',
          2: 'repeat(2, minmax(0, 1fr))',
          3: 'repeat(3, minmax(0, 1fr))',
          4: 'repeat(4, minmax(0, 1fr))',
          5: 'repeat(5, minmax(0, 1fr))',
          6: 'repeat(6, minmax(0, 1fr))',
          none: 'none'
        }
      },
      customCSS: ''
    };
    
    return {
      ...defaultConfig,
      ...config,
      theme: {
        ...defaultConfig.theme,
        ...config.theme
      }
    } as GreatConfig;
  }
}

// Types
export interface GreatConfig {
  theme: Theme;
  customCSS: string;
}

export interface Theme {
  colors: ColorPalette;
  spacing: Record<string, string>;
  sizing: Record<string, string>;
  typography: Typography;
  breakpoints: Record<string, string>;
  borderRadius: Record<string, string>;
  borderWidth: Record<string, string>;
  boxShadow: Record<string, string>;
  zIndex: Record<string, string>;
  transitionDuration: Record<string, string>;
  transitionTimingFunction: Record<string, string>;
  transitionDelay: Record<string, string>;
  gridColumns: Record<string, string>;
  gridRows: Record<string, string>;
}

export interface ColorPalette {
  [key: string]: string | ColorScale;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Typography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
}

export interface UtilityClass {
  property: string;
  values: Record<string, string>;
  multiple: boolean;
  transform?: (value: string) => string;
}

export interface Variant {
  name: string;
  selector: string;
  type: 'pseudo' | 'media' | 'selector';
}

export interface Component {
  name: string;
  baseStyles: string;
  variants: Record<string, string>;
  sizes: Record<string, string>;
}

// Singleton instance for global use
export const great = new Great();

// Convenience exports
export default great;