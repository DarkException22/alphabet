/**
 * Great CSS & JS Framework
 * Utility-first framework with beautiful, modern UI components
 */

export class GreatFramework {
  private config: GreatConfig;
  private styles: Map<string, string> = new Map();
  private components: Map<string, GreatComponent> = new Map();
  private utilities: Map<string, UtilityGenerator> = new Map();
  private theme: Theme;

  constructor(config: Partial<GreatConfig> = {}) {
    this.config = this.mergeDefaultConfig(config);
    this.theme = this.config.theme;
    
    this.initialize();
  }

  /**
   * Initialize framework
   */
  private initialize(): void {
    this.generateBaseStyles();
    this.generateUtilityClasses();
    this.registerDefaultComponents();
    
    if (this.config.injectStyles !== false) {
      this.injectStyles();
    }
  }

  /**
   * Generate base styles
   */
  private generateBaseStyles(): void {
    const baseStyles = `
      /* Reset and base styles */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html {
        font-size: 16px;
        line-height: 1.5;
        -webkit-text-size-adjust: 100%;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: ${this.theme.typography.fontFamily.sans.join(', ')};
        font-size: ${this.theme.typography.fontSize.base};
        line-height: ${this.theme.typography.lineHeight.normal};
        color: ${this.theme.colors.neutral[900]};
        background-color: ${this.theme.colors.white};
      }

      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        font-weight: ${this.theme.typography.fontWeight.bold};
        line-height: ${this.theme.typography.lineHeight.tight};
        margin-bottom: ${this.theme.spacing[4]};
      }

      h1 { font-size: ${this.theme.typography.fontSize['4xl']}; }
      h2 { font-size: ${this.theme.typography.fontSize['3xl']}; }
      h3 { font-size: ${this.theme.typography.fontSize['2xl']}; }
      h4 { font-size: ${this.theme.typography.fontSize.xl}; }
      h5 { font-size: ${this.theme.typography.fontSize.lg}; }
      h6 { font-size: ${this.theme.typography.fontSize.base}; }

      p {
        margin-bottom: ${this.theme.spacing[4]};
      }

      a {
        color: ${this.theme.colors.primary[500]};
        text-decoration: none;
        transition: color 0.2s;
      }

      a:hover {
        color: ${this.theme.colors.primary[700]};
      }

      /* Form elements */
      input, button, textarea, select {
        font: inherit;
      }

      /* Utility classes will be added dynamically */
    `;

    this.styles.set('base', baseStyles);
  }

  /**
   * Generate utility classes
   */
  private generateUtilityClasses(): void {
    const utilities: string[] = [];

    // Margin and padding utilities
    Object.entries(this.theme.spacing).forEach(([key, value]) => {
      utilities.push(`
        .m-${key} { margin: ${value}; }
        .mx-${key} { margin-left: ${value}; margin-right: ${value}; }
        .my-${key} { margin-top: ${value}; margin-bottom: ${value}; }
        .mt-${key} { margin-top: ${value}; }
        .mr-${key} { margin-right: ${value}; }
        .mb-${key} { margin-bottom: ${value}; }
        .ml-${key} { margin-left: ${value}; }
        
        .p-${key} { padding: ${value}; }
        .px-${key} { padding-left: ${value}; padding-right: ${value}; }
        .py-${key} { padding-top: ${value}; padding-bottom: ${value}; }
        .pt-${key} { padding-top: ${value}; }
        .pr-${key} { padding-right: ${value}; }
        .pb-${key} { padding-bottom: ${value}; }
        .pl-${key} { padding-left: ${value}; }
      `);
    });

    // Color utilities
    Object.entries(this.theme.colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'string') {
        utilities.push(`
          .text-${colorName} { color: ${colorValue}; }
          .bg-${colorName} { background-color: ${colorValue}; }
          .border-${colorName} { border-color: ${colorValue}; }
        `);
      } else if (typeof colorValue === 'object') {
        Object.entries(colorValue).forEach(([shade, shadeValue]) => {
          utilities.push(`
            .text-${colorName}-${shade} { color: ${shadeValue}; }
            .bg-${colorName}-${shade} { background-color: ${shadeValue}; }
            .border-${colorName}-${shade} { border-color: ${shadeValue}; }
          `);
        });
      }
    });

    // Typography utilities
    Object.entries(this.theme.typography.fontSize).forEach(([key, value]) => {
      utilities.push(`.text-${key} { font-size: ${value}; }`);
    });

    Object.entries(this.theme.typography.fontWeight).forEach(([key, value]) => {
      utilities.push(`.font-${key} { font-weight: ${value}; }`);
    });

    // Flex utilities
    utilities.push(`
      .flex { display: flex; }
      .inline-flex { display: inline-flex; }
      .flex-row { flex-direction: row; }
      .flex-col { flex-direction: column; }
      .flex-wrap { flex-wrap: wrap; }
      .flex-nowrap { flex-wrap: nowrap; }
      .items-center { align-items: center; }
      .items-start { align-items: flex-start; }
      .items-end { align-items: flex-end; }
      .justify-center { justify-content: center; }
      .justify-start { justify-content: flex-start; }
      .justify-end { justify-content: flex-end; }
      .justify-between { justify-content: space-between; }
      .justify-around { justify-content: space-around; }
      .flex-1 { flex: 1 1 0%; }
      .flex-auto { flex: 1 1 auto; }
      .flex-none { flex: none; }
    `);

    // Grid utilities
    utilities.push(`
      .grid { display: grid; }
      .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .gap-4 { gap: 1rem; }
      .gap-8 { gap: 2rem; }
    `);

    // Border utilities
    utilities.push(`
      .rounded { border-radius: 0.25rem; }
      .rounded-lg { border-radius: 0.5rem; }
      .rounded-full { border-radius: 9999px; }
      .border { border-width: 1px; }
      .border-0 { border-width: 0; }
      .border-2 { border-width: 2px; }
      .border-solid { border-style: solid; }
      .border-dashed { border-style: dashed; }
      .border-none { border-style: none; }
    `);

    // Display utilities
    utilities.push(`
      .block { display: block; }
      .inline-block { display: inline-block; }
      .inline { display: inline; }
      .hidden { display: none; }
    `);

    // Position utilities
    utilities.push(`
      .relative { position: relative; }
      .absolute { position: absolute; }
      .fixed { position: fixed; }
      .sticky { position: sticky; }
      .static { position: static; }
      .top-0 { top: 0; }
      .right-0 { right: 0; }
      .bottom-0 { bottom: 0; }
      .left-0 { left: 0; }
      .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
      .z-0 { z-index: 0; }
      .z-10 { z-index: 10; }
      .z-20 { z-index: 20; }
      .z-30 { z-index: 30; }
      .z-40 { z-index: 40; }
      .z-50 { z-index: 50; }
    `);

    // Width and height utilities
    utilities.push(`
      .w-full { width: 100%; }
      .w-screen { width: 100vw; }
      .w-auto { width: auto; }
      .w-1/2 { width: 50%; }
      .w-1/3 { width: 33.333333%; }
      .w-2/3 { width: 66.666667%; }
      .w-1/4 { width: 25%; }
      .w-3/4 { width: 75%; }
      
      .h-full { height: 100%; }
      .h-screen { height: 100vh; }
      .h-auto { height: auto; }
    `);

    // Text utilities
    utilities.push(`
      .text-left { text-align: left; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-justify { text-align: justify; }
      .uppercase { text-transform: uppercase; }
      .lowercase { text-transform: lowercase; }
      .capitalize { text-transform: capitalize; }
      .normal-case { text-transform: none; }
      .underline { text-decoration: underline; }
      .line-through { text-decoration: line-through; }
      .no-underline { text-decoration: none; }
      .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    `);

    // Overflow utilities
    utilities.push(`
      .overflow-auto { overflow: auto; }
      .overflow-hidden { overflow: hidden; }
      .overflow-visible { overflow: visible; }
      .overflow-scroll { overflow: scroll; }
      .overflow-x-auto { overflow-x: auto; }
      .overflow-y-auto { overflow-y: auto; }
    `);

    // Shadow utilities
    utilities.push(`
      .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
      .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
      .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
      .shadow-none { box-shadow: none; }
    `);

    // Transition utilities
    utilities.push(`
      .transition { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .transition-colors { transition-property: background-color, border-color, color, fill, stroke; }
      .transition-opacity { transition-property: opacity; }
      .transition-transform { transition-property: transform; }
      .duration-75 { transition-duration: 75ms; }
      .duration-100 { transition-duration: 100ms; }
      .duration-150 { transition-duration: 150ms; }
      .duration-200 { transition-duration: 200ms; }
      .duration-300 { transition-duration: 300ms; }
      .duration-500 { transition-duration: 500ms; }
      .ease-in { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
      .ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
      .ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
    `);

    // Opacity utilities
    utilities.push(`
      .opacity-0 { opacity: 0; }
      .opacity-25 { opacity: 0.25; }
      .opacity-50 { opacity: 0.5; }
      .opacity-75 { opacity: 0.75; }
      .opacity-100 { opacity: 1; }
    `);

    this.styles.set('utilities', utilities.join('\n'));
  }

  /**
   * Register default components
   */
  private registerDefaultComponents(): void {
    // Button component
    this.registerComponent('Button', {
      template: (props: ButtonProps) => `
        <button 
          class="${props.baseClass} ${props.variantClass} ${props.sizeClass} ${props.additionalClasses}"
          type="${props.type || 'button'}"
          ${props.disabled ? 'disabled' : ''}
        >
          ${props.children || props.text || ''}
        </button>
      `,
      defaultProps: {
        baseClass: 'px-4 py-2 rounded font-medium transition-colors',
        variant: 'primary',
        size: 'md'
      },
      variants: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
        outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
      },
      sizes: {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
      }
    });

    // Card component
    this.registerComponent('Card', {
      template: (props: CardProps) => `
        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 ${props.className || ''}">
          ${props.title ? `<h3 class="text-xl font-semibold mb-4">${props.title}</h3>` : ''}
          ${props.children || ''}
        </div>
      `
    });

    // Alert component
    this.registerComponent('Alert', {
      template: (props: AlertProps) => `
        <div class="p-4 rounded border ${
          props.variant === 'success' ? 'bg-success-50 text-success-800 border-success-200' :
          props.variant === 'warning' ? 'bg-warning-50 text-warning-800 border-warning-200' :
          props.variant === 'error' ? 'bg-error-50 text-error-800 border-error-200' :
          'bg-info-50 text-info-800 border-info-200'
        } ${props.className || ''}">
          ${props.title ? `<div class="font-bold">${props.title}</div>` : ''}
          <div>${props.message || props.children || ''}</div>
        </div>
      `
    });

    // Input component
    this.registerComponent('Input', {
      template: (props: InputProps) => `
        <input
          type="${props.type || 'text'}"
          class="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            props.error ? 'border-error-500 focus:ring-error-500' :
            props.success ? 'border-success-500 focus:ring-success-500' : ''
          } ${props.className || ''}"
          placeholder="${props.placeholder || ''}"
          value="${props.value || ''}"
          ${props.disabled ? 'disabled' : ''}
          ${props.readOnly ? 'readonly' : ''}
        />
      `
    });
  }

  /**
   * Inject styles into document
   */
  injectStyles(): void {
    if (typeof document === 'undefined') return;

    const styleId = 'great-framework-styles';
    
    // Remove existing styles
    const existing = document.getElementById(styleId);
    if (existing) {
      existing.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = this.getCSS();

    document.head.appendChild(style);
  }

  /**
   * Get compiled CSS
   */
  getCSS(): string {
    const allStyles = Array.from(this.styles.values()).join('\n');
    
    // Add custom CSS if provided
    if (this.config.customCSS) {
      return allStyles + '\n' + this.config.customCSS;
    }
    
    return allStyles;
  }

  /**
   * Register a component
   */
  registerComponent(name: string, component: GreatComponent): void {
    this.components.set(name, component);
  }

  /**
   * Get a component
   */
  getComponent(name: string): GreatComponent | undefined {
    return this.components.get(name);
  }

  /**
   * Create an instance of a component
   */
  createComponent(name: string, props: any = {}): HTMLElement {
    const component = this.components.get(name);
    if (!component) {
      throw new Error(`Component "${name}" not found`);
    }

    const template = component.template(props);
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    
    return doc.body.firstChild as HTMLElement;
  }

  /**
   * Add utility generator
   */
  addUtility(name: string, generator: UtilityGenerator): void {
    this.utilities.set(name, generator);
  }

  /**
   * Generate custom utility classes
   */
  generateCustomUtilities(): string {
    const customUtilities: string[] = [];
    
    this.utilities.forEach((generator, name) => {
      const utilityCSS = generator(this.theme);
      customUtilities.push(`/* ${name} utilities */\n${utilityCSS}`);
    });
    
    return customUtilities.join('\n');
  }

  /**
   * Update theme
   */
  updateTheme(newTheme: Partial<Theme>): void {
    this.theme = { ...this.theme, ...newTheme };
    this.generateBaseStyles();
    this.generateUtilityClasses();
    
    if (this.config.injectStyles !== false) {
      this.injectStyles();
    }
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(): void {
    if (this.theme.mode === 'dark') {
      this.updateTheme({ mode: 'light' });
    } else {
      this.updateTheme({ mode: 'dark' });
    }
  }

  /**
   * Merge default config
   */
  private mergeDefaultConfig(config: Partial<GreatConfig>): GreatConfig {
    const defaultConfig: GreatConfig = {
      theme: {
        colors: {
          primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
          secondary: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
          neutral: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' },
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
          white: '#ffffff',
          black: '#000000'
        },
        typography: {
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            serif: ['Georgia', 'Cambria', 'serif'],
            mono: ['Menlo', 'Monaco', 'Consolas', 'monospace']
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
            '5xl': '3rem'
          },
          fontWeight: {
            thin: 100,
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
            black: 900
          },
          lineHeight: {
            none: 1,
            tight: 1.25,
            snug: 1.375,
            normal: 1.5,
            relaxed: 1.625,
            loose: 2
          }
        },
        spacing: {
          0: '0',
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
          24: '6rem'
        },
        breakpoints: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px'
        },
        mode: 'light'
      },
      injectStyles: true,
      customCSS: ''
    };

    return {
      ...defaultConfig,
      ...config,
      theme: {
        ...defaultConfig.theme,
        ...config.theme,
        colors: {
          ...defaultConfig.theme.colors,
          ...config.theme?.colors
        },
        typography: {
          ...defaultConfig.theme.typography,
          ...config.theme?.typography
        },
        spacing: {
          ...defaultConfig.theme.spacing,
          ...config.theme?.spacing
        },
        breakpoints: {
          ...defaultConfig.theme.breakpoints,
          ...config.theme?.breakpoints
        }
      }
    };
  }
}

// Types
export interface GreatConfig {
  theme: Theme;
  injectStyles: boolean;
  customCSS: string;
}

export interface Theme {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    neutral: ColorScale;
    success: string;
    warning: string;
    error: string;
    info: string;
    white: string;
    black: string;
    [key: string]: ColorScale | string;
  };
  typography: {
    fontFamily: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    fontSize: {
      [key: string]: string;
    };
    fontWeight: {
      [key: string]: number;
    };
    lineHeight: {
      [key: string]: number;
    };
  };
  spacing: {
    [key: string]: string;
  };
  breakpoints: {
    [key: string]: string;
  };
  mode: 'light' | 'dark' | 'auto';
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

export interface GreatComponent {
  template: (props: any) => string;
  defaultProps?: any;
  variants?: Record<string, string>;
  sizes?: Record<string, string>;
}

export type UtilityGenerator = (theme: Theme) => string;

// Component prop interfaces
export interface ButtonProps {
  baseClass?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  children?: string;
  text?: string;
  additionalClasses?: string;
}

export interface CardProps {
  title?: string;
  children?: string;
  className?: string;
}

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string;
  children?: string;
  className?: string;
}

export interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  success?: boolean;
  className?: string;
}

// Singleton instance
export const great = new GreatFramework();