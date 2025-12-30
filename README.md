# Alphabet Frameworks

> Note: Alphabet is a set of frameworks: HarmonyS (Harmony JavaScript) (For JavaScript-based advanced framework), AlphabeTS (Alphabet TypeScript) (For TypeScript-based advanced framework), Great CSS (An utility-first CSS framework, better than Tailwind and optimized for Alphabet Frameworks)

**A lightweight, simple, and complete JavaScript/TypeScript framework with reactive DOM and utility-first CSS.**

## 🚀 No CLI? No Problem!

**Important: We currently don't have `@alphabet/cli` published. You need to build everything from source yourself!**

### 📥 Installation (From Source)

```bash
# 1. Clone the repository
git clone https://github.com/OverLab-Group/alphabet.git
cd alphabet

# 2. Install dependencies
npm install

# 3. Build the framework (this uses Rollup)
npm run build

# 4. Build TypeScript definitions
npm run build:ts

# Optional: Build the CSS framework separately
npm run build:great
```

### 🛠️ Manual Build with Rollup

If you want to customize the build:

```bash
# Install Rollup globally (if not already)
npm install -g rollup

# Build UMD bundle (browser)
rollup -c rollup.config.js

# Build ES module
npx rollup -c --environment FORMAT:es

# Watch mode for development
npx rollup -c -w
```

## 🏗️ What's Inside Alphabet?

Alphabet Framework consists of several interconnected systems:

### 1. **Core System** (`/src/core/`)
- **`configer.ts`** - YAML-based configuration system
- **`error.ts`** - Robust error handling with error boundaries
- **`modularity.ts`** - Module registry and dependency management
- **`plugin-injector.ts`** - Dynamic plugin injection system

### 2. **Component System** (`/src/cmps/`)
- **`proxy.ts`** - Reactive proxy system (no Virtual DOM!)
- **`binder.ts`** - Template binding with `{{ }}` syntax
- **`attribute-binder.ts`** - Component binding via `data-alphabet-*` attributes
- **`bind-as-cls.ts`** - Component binding via CSS classes

### 3. **Reactive DOM** (`/src/reactive-dom/`)
- **`dom.ts`** - Converts regular DOM to reactive DOM
- **`update.ts`** - Efficient DOM updates (no full re-renders)
- **`event.ts`** - Event management system
- **`no-full-update.ts`** - SPA navigation without page reloads

### 4. **Server-Side Rendering** (`/src/ssr/`)
- **`ssr-all.ts`** - Complete SSR system with hydration
- **`ssr-cmps.ts`** - Component-level SSR
- **`ssr-core.ts`** - Core module SSR
- **`ssr-utils.ts`** - Utility SSR

### 5. **Great CSS Framework** (`/src/great/`)
- **`great.ts`** - Utility-first CSS framework (Tailwind alternative)
- **`index.ts`** - Complete CSS framework with theming

### 6. **Plugins** (`/plugins/`)
- **`state-mngr/`** - Official state management plugin
- **More plugins can be added!**

### 7. **CLI** (`/cli/`) - *Not published yet*
- **`cli.ts`** - Interactive project setup
- **Currently for internal development only**

## 🔗 How Everything Connects?

```
┌─────────────────────────────────────────┐
│         Your Application                │
├─────────────────────────────────────────┤
│  Component System → Reactive DOM        │
│    (proxy/binder)    (no Virtual DOM)   │
├─────────────────────────────────────────┤
│      Great CSS Framework                │
│      (Utility-first styling)            │
├─────────────────────────────────────────┤
│  SSR System → Core System → Plugins     │
│  (Server render) (Config/Error) (State) │
└─────────────────────────────────────────┘
```

### Flow of Data:
1. **Components** use `proxy.ts` for reactive data
2. **DOM updates** happen directly via `reactive-dom/update.ts`
3. **Events** are managed by `event.ts`
4. **Configuration** comes from `configer.ts` (reads `alphabet.yaml`)
5. **SSR** renders components server-side with `ssr-all.ts`
6. **CSS** is provided by `great.ts` utility classes
7. **State management** via `plugins/state-mngr/`

## 🚀 Quick Usage (Without CLI)

### 1. Create Your Project Structure
```bash
mkdir my-alphabet-app
cd my-alphabet-app
npm init -y
```

### 2. Link to Local Alphabet Build
```bash
# From your alphabet framework directory
npm link

# From your app directory
npm link alphabet
```

### 3. Basic HTML Setup
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Alphabet App</title>
    <!-- Include built CSS if using Great CSS -->
    <link rel="stylesheet" href="../alphabet/dist/great.css">
</head>
<body>
    <div id="app">
        <!-- Components will be mounted here -->
    </div>
    
    <!-- Include Alphabet framework -->
    <script src="../alphabet/dist/alphabet.js"></script>
    <script>
        // Your app code here
    </script>
</body>
</html>
```

### 4. Simple Component Example
```javascript
// app.js
const { component, reactive } = Alphabet;

const Counter = component.create('Counter', `
    <div class="counter">
        <h1>{{ count }}</h1>
        <button @click="increment">+</button>
        <button @click="decrement">-</button>
    </div>
`, {
    state: () => ({ count: 0 }),
    methods: {
        increment() { this.count++ },
        decrement() { this.count-- }
    }
});

// Mount the component
const app = document.getElementById('app');
Counter.mount(app);
```

### 5. Using Great CSS
```html
<div class="p-6 bg-white rounded-lg shadow">
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Welcome!</h1>
    <p class="text-gray-600 mb-4">This uses Great CSS utility classes.</p>
    <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Get Started
    </button>
</div>
```

## 📁 Project Structure for Your App

```
my-alphabet-app/
├── index.html              # Main HTML file
├── src/
│   ├── app.js             # Main application
│   ├── components/        # Your components
│   │   ├── Counter.js
│   │   ├── TodoList.js
│   │   └── UserProfile.js
│   └── styles/
│       └── custom.css     # Additional styles
├── public/                # Static assets
└── alphabet.yaml          # Framework config (optional)
```

## 🔧 Configuration File (`alphabet.yaml`)

Create this in your project root:

```yaml
app:
  name: "My App"
  version: "1.0.0"
  mode: "development"

server:
  port: 3000
  ssr: true
  spa: true

build:
  minify: true
  sourcemaps: false
  target: "es2015"

features:
  stateManagement: true
  greatCSS: true
  pwa: false
```

## 🎯 Core Concepts Explained

### 1. **Reactivity Without Virtual DOM**
Alphabet uses a proxy-based system that tracks changes to data and updates only the specific DOM elements that need to change.

### 2. **Multiple Component Binding Methods**
- **Attribute-based**: `data-alphabet-cmp="ComponentName"`
- **Class-based**: `class="alphabet-component"`
- **Template-based**: `{{ variable }}` syntax

### 3. **Server-Side Rendering**
Components can be rendered on the server, then hydrated on the client for better SEO and performance.

### 4. **CSS-in-JS Alternative**
Great CSS provides utility classes similar to Tailwind, but with additional features and built-in components.

## 🤝 We NEED Contributors!

**Yes, we absolutely accept and encourage contributions!** Since this is an open-source project maintained by a small team, we rely on community contributions.

### How to Contribute:

#### 1. **Report Issues**
- Found a bug? Create an issue on GitHub
- Have a feature request? Let us know
- Documentation improvements? Yes please!

#### 2. **Submit Pull Requests**
```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/alphabet.git

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes
# 5. Test your changes
npm test

# 6. Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# 7. Open a Pull Request
```

#### 3. **Areas That Need Help:**
- **More plugins** (Router, Form validation, Authentication)
- **Better documentation** (Examples, tutorials, API docs)
- **Performance improvements**
- **Browser compatibility**
- **Testing infrastructure**
- **TypeScript definitions**

#### 4. **Development Guidelines:**
- Write clear, commented code
- Follow existing code style
- Add TypeScript types where possible
- Update documentation if needed
- Test your changes

## 📦 Building for Production

### Bundle Size Optimization
```bash
# Minified UMD build (for browsers)
npm run build:minify

# Tree-shaking with ES modules
npm run build:bundle

# Generate TypeScript definitions
npm run build:ts
```

### Custom Rollup Config
Create `rollup.custom.config.js`:
```javascript
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/core/index.ts',
  output: {
    file: 'dist/alphabet.custom.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    typescript({ tsconfig: './tsconfig.json' })
  ]
};
```

## 🐛 Known Limitations

### What Works:
- ✅ Reactive components
- ✅ SSR with hydration  
- ✅ Great CSS framework
- ✅ State management plugin
- ✅ Error handling
- ✅ Configuration system

### What's Missing/Needs Work:
- ❌ Published CLI (you need to build manually)
- ❌ Comprehensive documentation
- ❌ Advanced routing system
- ❌ Form validation
- ❌ Testing framework
- ❌ Performance benchmarks

## 📄 License

**Apache License 2.0** - See [LICENSE](https://github.com/OverLab-Group/alphabet/blob/main/LICENSE) file for details.

You are free to:
- Use commercially
- Modify and distribute
- Place warranty
- Patent use

Under the conditions:
- Give appropriate credit
- Indicate changes made
- Include original license

## 🔗 Links

- **GitHub Repository**: https://github.com/OverLab-Group/alphabet
- **Issue Tracker**: https://github.com/OverLab-Group/alphabet/issues
- **License**: Apache 2.0

## 🙏 Acknowledgments

Built with ❤️ by the open-source community. This framework is maintained by developers who believe in making web development simpler, faster, and more enjoyable.

---

**Remember**: This is a community-driven project. Your contributions shape its future! Whether it's fixing a typo, adding a feature, or reporting a bug - every contribution matters.

*Last updated: December 31, 2025*
