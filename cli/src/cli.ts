#!/usr/bin/env node

/**
 * CLI Alphabet Interface (CAI) v2.0
 * Interactive project setup and management
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs-extra';
import path from 'path';
import { execSync, spawn } from 'child_process';
import validatePackageName from 'validate-npm-package-name';
import glob from 'glob';

// ASCII Art for branding
const ALPHABET_ART = `
   ___    __    __    __    __    ___   ______   ______   ______   ______  
  / _ \\  / /   / /   / /   / /   / _ \\ / ____/  / ____/  / ____/  / ____/ 
 / // / / /   / /   / /   / /   / ___// __/    / __/    / __/    / __/    
/____/ /_/   /_/   /_/   /_/   /_/   /_/      /_/      /_/      /_/       
                                                                          
`;

// Version info
const VERSION = '2.0.0';

// Types
interface ProjectConfig {
  projectName: string;
  projectDescription?: string;
  author: string;
  version: string;
  license: string;
  publishAsPackage: boolean;
  packageName?: string;
  useGreatCSS: boolean;
  needsBackend: boolean;
  needsStateManagement: boolean;
  needsSSR: boolean;
  frameworkType: 'javascript' | 'typescript';
  packageManager: 'npm' | 'yarn' | 'pnpm';
  needsNodeJS: boolean;
  isPWA: boolean;
  port: number;
  gitInit: boolean;
  installDeps: boolean;
  template: 'basic' | 'spa' | 'ssr' | 'fullstack';
}

// Default configuration
const DEFAULT_CONFIG: Partial<ProjectConfig> = {
  version: '1.0.0',
  license: 'MIT',
  publishAsPackage: false,
  useGreatCSS: true,
  needsBackend: false,
  needsStateManagement: false,
  needsSSR: true,
  frameworkType: 'typescript',
  packageManager: 'npm',
  needsNodeJS: false,
  isPWA: false,
  port: 3000,
  gitInit: true,
  installDeps: true,
  template: 'basic'
};

// Questions for interactive mode
const QUESTIONS = [
  {
    type: 'input',
    name: 'projectName',
    message: '📝 نام پروژه؟',
    validate: (input: string) => {
      if (!input.trim()) return 'نام پروژه الزامی است';
      
      const validation = validatePackageName(input);
      if (!validation.validForNewPackages) {
        return validation.errors?.join(', ') || 'نام پروژه نامعتبر است';
      }
      
      if (fs.existsSync(input)) {
        return `پوشه "${input}" از قبل وجود دارد`;
      }
      
      return true;
    },
    filter: (input: string) => input.trim()
  },
  {
    type: 'input',
    name: 'projectDescription',
    message: '📋 توضیحات پروژه (اختیاری):',
    default: 'یک پروژه زیبا با Alphabet Framework'
  },
  {
    type: 'input',
    name: 'author',
    message: '👤 نام سازنده؟',
    validate: (input: string) => input.trim() ? true : 'نام سازنده الزامی است',
    filter: (input: string) => input.trim()
  },
  {
    type: 'input',
    name: 'version',
    message: '🏷️  ورژن پروژه؟',
    default: DEFAULT_CONFIG.version,
    validate: (input: string) => /^\d+\.\d+\.\d+$/.test(input) ? true : 'فرمت ورژن نامعتبر (مثال: 1.0.0)'
  },
  {
    type: 'list',
    name: 'license',
    message: '📄 لایسنس؟',
    choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense', 'Custom'],
    default: DEFAULT_CONFIG.license
  },
  {
    type: 'confirm',
    name: 'publishAsPackage',
    message: '📦 آیا مایل به پابلیک شدن آن به عنوان پکیج هستید؟',
    default: DEFAULT_CONFIG.publishAsPackage
  },
  {
    type: 'input',
    name: 'packageName',
    message: '📦 نام پکیج برای انتشار در npm:',
    when: (answers: any) => answers.publishAsPackage,
    validate: (input: string) => {
      const validation = validatePackageName(input);
      return validation.validForNewPackages ? true : validation.errors?.join(', ') || 'نام پکیج نامعتبر';
    }
  },
  {
    type: 'number',
    name: 'port',
    message: '🌐 پورتی که برنامه باید روی آن اجرا شود؟',
    default: DEFAULT_CONFIG.port,
    validate: (input: number) => (input > 0 && input < 65536) ? true : 'پورت باید بین 1 تا 65535 باشد'
  },
  {
    type: 'confirm',
    name: 'useGreatCSS',
    message: '🎨 آیا می‌خواهید از Great CSS استفاده کنید؟',
    default: DEFAULT_CONFIG.useGreatCSS
  },
  {
    type: 'confirm',
    name: 'needsBackend',
    message: '🔧 آیا پروژه شما Back-end (PHP) نیاز دارد؟',
    default: DEFAULT_CONFIG.needsBackend
  },
  {
    type: 'confirm',
    name: 'needsStateManagement',
    message: '🔄 آیا پروژه شما State Management نیاز دارد؟',
    default: DEFAULT_CONFIG.needsStateManagement
  },
  {
    type: 'confirm',
    name: 'needsSSR',
    message: '⚡ آیا پروژه شما SSR می‌خواهد؟',
    default: DEFAULT_CONFIG.needsSSR
  },
  {
    type: 'list',
    name: 'frameworkType',
    message: '💻 آیا پروژه شما Alphabet (JS) است یا Alphabets (TS)؟',
    choices: [
      { name: 'JavaScript (Alphabet)', value: 'javascript' },
      { name: 'TypeScript (Alphabets)', value: 'typescript' }
    ],
    default: DEFAULT_CONFIG.frameworkType
  },
  {
    type: 'list',
    name: 'packageManager',
    message: '📦 پکیج منیجر مورد نظر؟',
    choices: ['npm', 'yarn', 'pnpm'],
    default: DEFAULT_CONFIG.packageManager
  },
  {
    type: 'confirm',
    name: 'needsNodeJS',
    message: '🚀 آیا شما نیاز به Node.js دارید؟',
    default: DEFAULT_CONFIG.needsNodeJS
  },
  {
    type: 'confirm',
    name: 'isPWA',
    message: '📱 آیا پروژه شما PWA هست؟',
    default: DEFAULT_CONFIG.isPWA
  },
  {
    type: 'list',
    name: 'template',
    message: '🎨 قالب پروژه؟',
    choices: [
      { name: 'پایه (Basic)', value: 'basic' },
      { name: 'تک صفحه‌ای (SPA)', value: 'spa' },
      { name: 'SSR با سمت سرور', value: 'ssr' },
      { name: 'فول‌استک (Fullstack)', value: 'fullstack' }
    ],
    default: DEFAULT_CONFIG.template
  },
  {
    type: 'confirm',
    name: 'gitInit',
    message: '🔧 آیا Git repository ساخته شود؟',
    default: DEFAULT_CONFIG.gitInit
  },
  {
    type: 'confirm',
    name: 'installDeps',
    message: '📥 آیا dependencies نصب شوند؟',
    default: DEFAULT_CONFIG.installDeps
  }
];

// Template configurations
const TEMPLATES = {
  basic: {
    name: 'basic',
    description: 'پروژه پایه با Alphabet Framework',
    dependencies: ['alphabet-core'],
    devDependencies: ['typescript', '@types/node'],
    files: ['index.html', 'src/index.ts', 'src/app.ts', 'tsconfig.json']
  },
  spa: {
    name: 'spa',
    description: 'تک‌صفحه‌ای (SPA) با routing',
    dependencies: ['alphabet-core'],
    devDependencies: ['typescript', '@types/node'],
    files: ['index.html', 'src/index.ts', 'src/app.ts', 'src/router.ts', 'tsconfig.json']
  },
  ssr: {
    name: 'ssr',
    description: 'SSR با سمت سرور',
    dependencies: ['alphabet-core'],
    devDependencies: ['typescript', '@types/node', 'express'],
    files: ['index.html', 'src/index.ts', 'src/app.ts', 'server/index.ts', 'tsconfig.json']
  },
  fullstack: {
    name: 'fullstack',
    description: 'فول‌استک با frontend و backend',
    dependencies: ['alphabet-core'],
    devDependencies: ['typescript', '@types/node', 'express'],
    files: [
      'index.html',
      'src/index.ts',
      'src/app.ts',
      'src/router.ts',
      'server/index.ts',
      'api/index.php',
      'tsconfig.json'
    ]
  }
};

class ProjectGenerator {
  private config: ProjectConfig;
  private spinner: ora.Ora;

  constructor(config: ProjectConfig) {
    this.config = config;
    this.spinner = ora();
  }

  async generate(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(chalk.cyan(ALPHABET_ART));
      console.log(chalk.cyan(`🚀 Alphabet CLI v${VERSION}\n`));
      
      this.spinner.start('در حال ساخت پروژه...');
      
      // Create project directory
      await this.createProjectDirectory();
      
      // Generate package.json
      await this.generatePackageJson();
      
      // Generate configuration files
      await this.generateConfigFiles();
      
      // Generate source files based on template
      await this.generateSourceFiles();
      
      // Generate example files
      await this.generateExampleFiles();
      
      // Initialize Git repository if requested
      if (this.config.gitInit) {
        await this.initGitRepository();
      }
      
      // Install dependencies if requested
      if (this.config.installDeps) {
        await this.installDependencies();
      }
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      this.spinner.succeed(chalk.green(`✅ پروژه "${this.config.projectName}" در ${duration} ثانیه ساخته شد!\n`));
      
      // Show next steps
      this.showNextSteps();
      
    } catch (error) {
      this.spinner.fail(chalk.red('❌ خطا در ساخت پروژه'));
      console.error(chalk.red(error instanceof Error ? error.message : 'خطای ناشناخته'));
      process.exit(1);
    }
  }

  private async createProjectDirectory(): Promise<void> {
    const projectPath = path.join(process.cwd(), this.config.projectName);
    
    if (fs.existsSync(projectPath)) {
      throw new Error(`پوشه "${this.config.projectName}" از قبل وجود دارد`);
    }
    
    await fs.ensureDir(projectPath);
    
    // Create subdirectories
    const directories = [
      'src',
      'public',
      'dist',
      'tests',
      'docs',
      'examples'
    ];
    
    if (this.config.needsNodeJS) {
      directories.push('server');
    }
    
    if (this.config.needsBackend) {
      directories.push('api');
    }
    
    for (const dir of directories) {
      await fs.ensureDir(path.join(projectPath, dir));
    }
  }

  private async generatePackageJson(): Promise<void> {
    const packageJson: any = {
      name: this.config.publishAsPackage ? this.config.packageName : this.config.projectName,
      version: this.config.version,
      description: this.config.projectDescription || 'A project built with Alphabet Framework',
      author: this.config.author,
      license: this.config.license,
      main: 'dist/index.js',
      module: 'dist/index.esm.js',
      types: 'dist/index.d.ts',
      scripts: this.getPackageScripts(),
      dependencies: this.getDependencies(),
      devDependencies: this.getDevDependencies(),
      keywords: ['alphabet', 'framework', this.config.frameworkType],
      engines: {
        node: '>=18.0.0'
      }
    };
    
    if (this.config.publishAsPackage) {
      packageJson.repository = {
        type: 'git',
        url: `https://github.com/${this.config.author}/${this.config.packageName}.git`
      };
      packageJson.bugs = {
        url: `https://github.com/${this.config.author}/${this.config.packageName}/issues`
      };
      packageJson.homepage = `https://github.com/${this.config.author}/${this.config.packageName}#readme`;
    }
    
    const packageJsonPath = path.join(process.cwd(), this.config.projectName, 'package.json');
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  private getPackageScripts(): Record<string, string> {
    const scripts: Record<string, string> = {
      dev: 'alphabet dev',
      build: 'alphabet build',
      serve: 'alphabet serve',
      test: 'alphabet test',
      lint: 'alphabet lint',
      clean: 'rm -rf dist'
    };
    
    if (this.config.frameworkType === 'typescript') {
      scripts.build = 'tsc && alphabet build';
      scripts.dev = 'tsc --watch & alphabet dev';
    }
    
    if (this.config.needsNodeJS) {
      scripts['start:server'] = 'node server/index.js';
    }
    
    return scripts;
  }

  private getDependencies(): Record<string, string> {
    const deps: Record<string, string> = {
      'alphabet-core': '^2.0.0'
    };
    
    if (this.config.useGreatCSS) {
      deps['great-css'] = '^1.0.0';
    }
    
    if (this.config.needsStateManagement) {
      deps['@alphabet/state'] = '^2.0.0';
    }
    
    if (this.config.needsNodeJS) {
      deps.express = '^4.18.0';
    }
    
    if (this.config.isPWA) {
      deps['workbox-webpack-plugin'] = '^7.0.0';
    }
    
    return deps;
  }

  private getDevDependencies(): Record<string, string> {
    const devDeps: Record<string, string> = {};
    
    if (this.config.frameworkType === 'typescript') {
      devDeps.typescript = '^5.0.0';
      devDeps['@types/node'] = '^20.0.0';
      
      if (this.config.needsNodeJS) {
        devDeps['@types/express'] = '^4.17.0';
      }
    }
    
    devDeps['@alphabet/cli'] = '^2.0.0';
    
    return devDeps;
  }

  private async generateConfigFiles(): Promise<void> {
    const projectPath = path.join(process.cwd(), this.config.projectName);
    
    // Generate alphabet.yaml
    const alphabetConfig = {
      app: {
        name: this.config.projectName,
        version: this.config.version,
        author: this.config.author,
        description: this.config.projectDescription
      },
      build: {
        ssr: this.config.needsSSR,
        pwa: this.config.isPWA,
        target: this.config.frameworkType
      },
      server: {
        port: this.config.port
      },
      features: {
        stateManagement: this.config.needsStateManagement,
        backend: this.config.needsBackend,
        greatCSS: this.config.useGreatCSS
      }
    };
    
    await fs.writeFile(
      path.join(projectPath, 'alphabet.yaml'),
      this.objectToYaml(alphabetConfig)
    );
    
    // Generate tsconfig.json for TypeScript projects
    if (this.config.frameworkType === 'typescript') {
      const tsconfig = {
        compilerOptions: {
          target: 'es2015',
          module: 'esnext',
          lib: ['es2015', 'dom', 'dom.iterable'],
          declaration: true,
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests']
      };
      
      await fs.writeJson(
        path.join(projectPath, 'tsconfig.json'),
        tsconfig,
        { spaces: 2 }
      );
    }
    
    // Generate .gitignore
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.min.js
*.min.css

# Environment variables
.env
.env.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log`;
    
    await fs.writeFile(
      path.join(projectPath, '.gitignore'),
      gitignore
    );
    
    // Generate .env.example
    const envExample = `PORT=${this.config.port}
NODE_ENV=development
API_URL=http://localhost:${this.config.port}/api`;
    
    await fs.writeFile(
      path.join(projectPath, '.env.example'),
      envExample
    );
  }

  private async generateSourceFiles(): Promise<void> {
    const projectPath = path.join(process.cwd(), this.config.projectName);
    const template = TEMPLATES[this.config.template];
    
    // Generate index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.projectName}</title>
    ${this.config.useGreatCSS ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/great-css/dist/great.min.css">' : ''}
    ${this.config.isPWA ? `
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#3b82f6">
    ` : ''}
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/index.${this.config.frameworkType === 'typescript' ? 'ts' : 'js'}"></script>
</body>
</html>`;
    
    await fs.writeFile(
      path.join(projectPath, 'index.html'),
      indexHtml
    );
    
    // Generate main entry point
    const mainEntry = this.config.frameworkType === 'typescript' ? 
      this.generateTypeScriptEntry() : 
      this.generateJavaScriptEntry();
    
    await fs.writeFile(
      path.join(projectPath, 'src', `index.${this.config.frameworkType === 'typescript' ? 'ts' : 'js'}`),
      mainEntry
    );
    
    // Generate app file
    const appFile = this.config.frameworkType === 'typescript' ? 
      this.generateTypeScriptApp() : 
      this.generateJavaScriptApp();
    
    await fs.writeFile(
      path.join(projectPath, 'src', `app.${this.config.frameworkType === 'typescript' ? 'ts' : 'js'}`),
      appFile
    );
    
    // Generate router if needed
    if (['spa', 'fullstack'].includes(this.config.template)) {
      const routerFile = this.generateRouterFile();
      await fs.writeFile(
        path.join(projectPath, 'src', `router.${this.config.frameworkType === 'typescript' ? 'ts' : 'js'}`),
        routerFile
      );
    }
    
    // Generate server files if needed
    if (this.config.needsNodeJS) {
      await this.generateServerFiles();
    }
    
    // Generate PHP backend if needed
    if (this.config.needsBackend) {
      await this.generatePHPFiles();
    }
  }

  private generateTypeScriptEntry(): string {
    return `// ${this.config.projectName}
// Entry point for Alphabet Framework

import { createApp } from 'alphabet-core';
import { app } from './app';
${this.config.useGreatCSS ? "import 'great-css';" : ''}

// Initialize application
const initialize = async () => {
  try {
    // Create app instance
    const alphabetApp = createApp({
      name: '${this.config.projectName}',
      version: '${this.config.version}',
      root: '#app',
      ssr: ${this.config.needsSSR},
      reactive: true,
      errorHandling: true
    });

    // Register components
    Object.entries(app.components).forEach(([name, component]) => {
      alphabetApp.component(name, component);
    });

    // Mount application
    await alphabetApp.mount();

    console.log(\`✅ \${alphabetApp.name} v\${alphabetApp.version} is running!\`);

  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
  }
};

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}`;
  }

  private generateJavaScriptEntry(): string {
    return `// ${this.config.projectName}
// Entry point for Alphabet Framework

const { createApp } = require('alphabet-core');
const { app } = require('./app');
${this.config.useGreatCSS ? "require('great-css');" : ''}

// Initialize application
const initialize = async () => {
  try {
    // Create app instance
    const alphabetApp = createApp({
      name: '${this.config.projectName}',
      version: '${this.config.version}',
      root: '#app',
      ssr: ${this.config.needsSSR},
      reactive: true,
      errorHandling: true
    });

    // Register components
    Object.entries(app.components).forEach(([name, component]) => {
      alphabetApp.component(name, component);
    });

    // Mount application
    await alphabetApp.mount();

    console.log(\`✅ \${alphabetApp.name} v\${alphabetApp.version} is running!\`);

  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
  }
};

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}`;
  }

  private generateTypeScriptApp(): string {
    return `// ${this.config.projectName}
// Main application file

import { component, reactive } from 'alphabet-core';

// Define components
export const components = {
  HelloWorld: component.create('HelloWorld', \`
    <div class="hello-world">
      <h1>{{ greeting }}</h1>
      <p>{{ message }}</p>
      <button @click="handleClick">Click me!</button>
    </div>
  \`, {
    state: () => ({
      greeting: 'سلام دنیا!',
      message: 'خوش آمدید به ${this.config.projectName}'
    }),
    methods: {
      handleClick() {
        this.greeting = 'دکمه کلیک شد!';
        console.log('Button clicked!');
      }
    },
    styles: \`
      .hello-world {
        text-align: center;
        padding: 2rem;
        font-family: system-ui, sans-serif;
      }
      .hello-world h1 {
        color: #3b82f6;
        margin-bottom: 1rem;
      }
      .hello-world button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      }
      .hello-world button:hover {
        background: #2563eb;
      }
    \`
  })
};

// Export app configuration
export const app = {
  name: '${this.config.projectName}',
  version: '${this.config.version}',
  components
};`;
  }

  private generateJavaScriptApp(): string {
    return `// ${this.config.projectName}
// Main application file

const { component, reactive } = require('alphabet-core');

// Define components
const components = {
  HelloWorld: component.create('HelloWorld', \`
    <div class="hello-world">
      <h1>{{ greeting }}</h1>
      <p>{{ message }}</p>
      <button @click="handleClick">Click me!</button>
    </div>
  \`, {
    state: () => ({
      greeting: 'سلام دنیا!',
      message: 'خوش آمدید به ${this.config.projectName}'
    }),
    methods: {
      handleClick() {
        this.greeting = 'دکمه کلیک شد!';
        console.log('Button clicked!');
      }
    },
    styles: \`
      .hello-world {
        text-align: center;
        padding: 2rem;
        font-family: system-ui, sans-serif;
      }
      .hello-world h1 {
        color: #3b82f6;
        margin-bottom: 1rem;
      }
      .hello-world button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      }
      .hello-world button:hover {
        background: #2563eb;
      }
    \`
  })
};

// Export app configuration
module.exports = {
  name: '${this.config.projectName}',
  version: '${this.config.version}',
  components
};`;
  }

  private generateRouterFile(): string {
    return `// Router configuration
import { createRouter, defineRoute } from 'alphabet-core';

export const router = createRouter({
  mode: 'history',
  base: '/',
  routes: [
    defineRoute('/', 'Home', () => import('./pages/Home')),
    defineRoute('/about', 'About', () => import('./pages/About')),
    defineRoute('/contact', 'Contact', () => import('./pages/Contact')),
    defineRoute('*', 'NotFound', () => import('./pages/NotFound'))
  ]
});`;
  }

  private async generateServerFiles(): Promise<void> {
    const projectPath = path.join(process.cwd(), this.config.projectName);
    
    const serverFile = `// Server for ${this.config.projectName}
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || ${this.config.port};

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
  console.log(\`📁 Serving from: \${path.join(__dirname, '../dist')}\`);
});

export default app;`;
    
    await fs.writeFile(
      path.join(projectPath, 'server', 'index.ts'),
      serverFile
    );
  }

  private async generatePHPFiles(): Promise<void> {
    const projectPath = path.join(process.cwd(), this.config.projectName);
    
    const apiIndex = `<?php
// ${this.config.projectName} API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Simple router
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($request_uri, PHP_URL_PATH);

// Route handling
switch ($path) {
    case '/api/health':
        if ($request_method === 'GET') {
            echo json_encode([
                'status' => 'ok',
                'timestamp' => date('c'),
                'service' => '${this.config.projectName} API',
                'version' => '${this.config.version}'
            ]);
        }
        break;
        
    case '/api/data':
        if ($request_method === 'GET') {
            echo json_encode([
                'message' => 'Hello from PHP API!',
                'data' => [
                    ['id' => 1, 'name' => 'Item 1'],
                    ['id' => 2, 'name' => 'Item 2'],
                    ['id' => 3, 'name' => 'Item 3']
                ]
            ]);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
?>`;
    
    await fs.writeFile(
      path.join(projectPath, 'api', 'index.php'),
      apiIndex
    );
    
    // Create .htaccess for Apache
    const htaccess = `# ${this.config.projectName} API
RewriteEngine On
RewriteBase /api/

# Redirect all requests to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Set headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>`;
    
    await fs.writeFile(
      path.join(projectPath, 'api', '.htaccess'),
      htaccess
    );
  }

  private async generateExampleFiles(): Promise<void> {
    const projectPath = path.join(process.cwd(), this.config.projectName);
    
    // Create examples directory
    const examplesDir = path.join(projectPath, 'examples');
    await fs.ensureDir(examplesDir);
    
    // Basic example
    const basicExample = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مثال پایه - ${this.config.projectName}</title>
    ${this.config.useGreatCSS ? '<link rel="stylesheet" href="../node_modules/great-css/dist/great.min.css">' : ''}
</head>
<body>
    <div id="app">
        <h1>مثال پایه Alphabet Framework</h1>
        <p>این یک مثال ساده از استفاده از Alphabet Framework است.</p>
        
        <div id="counter-example"></div>
        <div id="todo-example"></div>
    </div>
    
    <script type="module">
        import { createApp, component, reactive } from '../dist/index.esm.js';
        
        // Counter component
        const Counter = component.create('Counter', \`
            <div class="counter">
                <h2>شمارنده: {{ count }}</h2>
                <button @click="increment">افزایش</button>
                <button @click="decrement">کاهش</button>
                <button @click="reset">بازنشانی</button>
            </div>
        \`, {
            state: () => ({ count: 0 }),
            methods: {
                increment() { this.count++; },
                decrement() { this.count--; },
                reset() { this.count = 0; }
            }
        });
        
        // Todo component
        const Todo = component.create('Todo', \`
            <div class="todo">
                <h2>لیست کارها</h2>
                <form @submit="addTodo">
                    <input 
                        type="text" 
                        placeholder="یک کار جدید بنویسید..."
                        v-model="newTodo"
                        required
                    >
                    <button type="submit">اضافه کردن</button>
                </form>
                <ul>
                    {{#each todos}}
                        <li>
                            <span>{{ title }}</span>
                            <button @click="removeTodo({{@index}})">حذف</button>
                        </li>
                    {{/each}}
                </ul>
            </div>
        \`, {
            state: () => ({
                newTodo: '',
                todos: [
                    { title: 'یادگیری Alphabet Framework', completed: false },
                    { title: 'ساخت یک پروژه واقعی', completed: false },
                    { title: 'اشتراک‌گذاری با جامعه', completed: false }
                ]
            }),
            methods: {
                addTodo(e) {
                    e.preventDefault();
                    if (this.newTodo.trim()) {
                        this.todos.push({
                            title: this.newTodo.trim(),
                            completed: false
                        });
                        this.newTodo = '';
                    }
                },
                removeTodo(index) {
                    this.todos.splice(index, 1);
                }
            }
        });
        
        // Create and mount app
        const app = createApp({
            name: 'ExampleApp',
            root: '#app'
        });
        
        app.component('Counter', Counter);
        app.component('Todo', Todo);
        
        app.mount();
    </script>
    
    <style>
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f5f5;
        }
        
        .counter, .todo {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            margin: 2rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 0.5rem;
        }
        
        button:hover {
            background: #2563eb;
        }
        
        input[type="text"] {
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 300px;
            margin-right: 1rem;
        }
        
        ul {
            list-style: none;
            padding: 0;
        }
        
        li {
            padding: 0.5rem;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    </style>
</body>
</html>`;
    
    await fs.writeFile(
      path.join(examplesDir, 'basic.html'),
      basicExample
    );
    
    // SPA example
    const spaExample = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مثال SPA - ${this.config.projectName}</title>
    ${this.config.useGreatCSS ? '<link rel="stylesheet" href="../node_modules/great-css/dist/great.min.css">' : ''}
</head>
<body>
    <div id="app">
        <nav>
            <a href="/" data-alphabet-route>خانه</a>
            <a href="/about" data-alphabet-route>درباره</a>
            <a href="/contact" data-alphabet-route>تماس</a>
        </nav>
        
        <main id="router-view"></main>
    </div>
    
    <script type="module">
        import { createApp, component, createRouter } from '../dist/index.esm.js';
        
        // Page components
        const HomePage = component.create('HomePage', \`
            <div class="page">
                <h1>خانه</h1>
                <p>به صفحه اصلی خوش آمدید!</p>
                <p>این یک برنامه تک‌صفحه‌ای (SPA) است که با Alphabet Framework ساخته شده.</p>
            </div>
        \`);
        
        const AboutPage = component.create('AboutPage', \`
            <div class="page">
                <h1>درباره ما</h1>
                <p>Alphabet Framework یک فریم‌ورک مدرن و سبک‌وزن برای توسعه برنامه‌های وب است.</p>
                <ul>
                    <li>واکنش‌گرا (Reactive DOM)</li>
                    <li>SSR پیش‌فرض</li>
                    <li>سبک‌تر از React</li>
                    <li>ساده‌تر از Vue</li>
                    <li>کامل‌تر از Angular</li>
                </ul>
            </div>
        \`);
        
        const ContactPage = component.create('ContactPage', \`
            <div class="page">
                <h1>تماس با ما</h1>
                <form @submit="handleSubmit">
                    <div>
                        <label>نام:</label>
                        <input type="text" v-model="form.name" required>
                    </div>
                    <div>
                        <label>ایمیل:</label>
                        <input type="email" v-model="form.email" required>
                    </div>
                    <div>
                        <label>پیام:</label>
                        <textarea v-model="form.message" rows="4" required></textarea>
                    </div>
                    <button type="submit">ارسال پیام</button>
                </form>
                <p v-if="submitted">پیام شما با موفقیت ارسال شد!</p>
            </div>
        \`, {
            state: () => ({
                form: { name: '', email: '', message: '' },
                submitted: false
            }),
            methods: {
                handleSubmit(e) {
                    e.preventDefault();
                    console.log('Form submitted:', this.form);
                    this.submitted = true;
                    this.form = { name: '', email: '', message: '' };
                }
            }
        });
        
        // Create router
        const router = createRouter({
            mode: 'history',
            base: '/',
            routes: [
                { path: '/', component: HomePage },
                { path: '/about', component: AboutPage },
                { path: '/contact', component: ContactPage }
            ]
        });
        
        // Create app
        const app = createApp({
            name: 'SPA Example',
            root: '#app'
        });
        
        // Register components
        app.component('HomePage', HomePage);
        app.component('AboutPage', AboutPage);
        app.component('ContactPage', ContactPage);
        
        // Mount app with router
        app.use(router);
        app.mount();
        
        // Handle route links
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.matches('[data-alphabet-route]')) {
                e.preventDefault();
                const href = target.getAttribute('href');
                if (href) {
                    router.navigate(href);
                }
            }
        });
    </script>
    
    <style>
        body {
            font-family: system-ui, sans-serif;
            margin: 0;
            padding: 0;
        }
        
        nav {
            background: #3b82f6;
            padding: 1rem;
            display: flex;
            gap: 2rem;
        }
        
        nav a {
            color: white;
            text-decoration: none;
            font-weight: 500;
        }
        
        nav a:hover {
            text-decoration: underline;
        }
        
        main {
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .page {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        form div {
            margin-bottom: 1rem;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        input, textarea {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
        }
        
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        }
        
        button:hover {
            background: #2563eb;
        }
    </style>
</body>
</html>`;
    
    await fs.writeFile(
      path.join(examplesDir, 'spa.html'),
      spaExample
    );
  }

  private async initGitRepository(): Promise<void> {
    const projectPath = path.join(process.cwd(), this.config.projectName);
    
    this.spinner.text = 'در حال ساخت Git repository...';
    
    try {
      execSync('git init', { cwd: projectPath, stdio: 'pipe' });
      
      // Create initial commit
      execSync('git add .', { cwd: projectPath, stdio: 'pipe' });
      execSync('git commit -m "Initial commit: Setup project with Alphabet Framework"', 
        { cwd: projectPath, stdio: 'pipe' });
      
      this.spinner.succeed('Git repository ساخته شد');
    } catch (error) {
      this.spinner.warn('ساخت Git repository ناموفق بود (شاید git نصب نیست)');
    }
  }

  private async installDependencies(): Promise<void> {
    const projectPath = path.join(process.cwd(), this.config.projectName);
    
    this.spinner.text = 'در حال نصب dependencies...';
    
    try {
      const installCommand = this.config.packageManager === 'yarn' ? 'yarn' :
                           this.config.packageManager === 'pnpm' ? 'pnpm install' : 'npm install';
      
      execSync(installCommand, { 
        cwd: projectPath, 
        stdio: 'inherit',
        shell: true
      });
      
      this.spinner.succeed('Dependencies با موفقیت نصب شدند');
    } catch (error) {
      this.spinner.warn('نصب dependencies ناموفق بود');
    }
  }

  private objectToYaml(obj: any): string {
    const convert = (data: any, indent: number = 0): string => {
      const spaces = ' '.repeat(indent);
      let yaml = '';
  
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          yaml += `${spaces}${key}:\n${convert(value, indent + 2)}`;
        } else if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          value.forEach(item => {
            if (typeof item === 'object') {
              yaml += `${spaces}  - ${convert(item, indent + 4).trim()}\n`;
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          });
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      }
  
      return yaml;
    };
  
    return convert(obj);
  }

  private showNextSteps(): void {
    console.log(chalk.cyan('\n🎉 پروژه شما آماده است!'));
    console.log(chalk.cyan('='.repeat(50)));
    
    console.log(chalk.green('\n📁 ساختار پروژه:'));
    console.log(chalk.gray(`  ${this.config.projectName}/`));
    console.log(chalk.gray(`  ├── src/           # کدهای منبع`));
    console.log(chalk.gray(`  ├── public/        # فایل‌های استاتیک`));
    console.log(chalk.gray(`  ├── dist/          # فایل‌های build شده`));
    console.log(chalk.gray(`  ├── tests/         # تست‌ها`));
    console.log(chalk.gray(`  ├── examples/      # مثال‌ها`));
    console.log(chalk.gray(`  ├── docs/          # مستندات`));
    if (this.config.needsNodeJS) console.log(chalk.gray(`  ├── server/         # سرور Node.js`));
    if (this.config.needsBackend) console.log(chalk.gray(`  ├── api/            # بک‌اند PHP`));
    console.log(chalk.gray(`  ├── index.html     # صفحه اصلی`));
    console.log(chalk.gray(`  ├── alphabet.yaml  # تنظیمات Alphabet`));
    console.log(chalk.gray(`  └── package.json   # تنظیمات پروژه`));
    
    console.log(chalk.green('\n🚀 مراحل بعدی:'));
    console.log(chalk.white(`  1. وارد پوشه پروژه شوید:`));
    console.log(chalk.cyan(`     cd ${this.config.projectName}`));
    
    console.log(chalk.white(`  2. توسعه را شروع کنید:`));
    console.log(chalk.cyan(`     ${this.config.packageManager} run dev`));
    
    console.log(chalk.white(`  3. پروژه را build کنید:`));
    console.log(chalk.cyan(`     ${this.config.packageManager} run build`));
    
    console.log(chalk.white(`  4. تست‌ها را اجرا کنید:`));
    console.log(chalk.cyan(`     ${this.config.packageManager} run test`));
    
    if (this.config.needsNodeJS) {
      console.log(chalk.white(`  5. سرور را اجرا کنید:`));
      console.log(chalk.cyan(`     ${this.config.packageManager} run start:server`));
    }
    
    console.log(chalk.green('\n📚 منابع مفید:'));
    console.log(chalk.cyan('  📖 مستندات: https://alphabet.dev/docs'));
    console.log(chalk.cyan('  💬 جامعه: https://github.com/alphabet-framework'));
    console.log(chalk.cyan('  🐛 گزارش باگ: https://github.com/alphabet-framework/alphabet/issues'));
    
    console.log(chalk.green('\n🌟 ویژگی‌های پروژه شما:'));
    console.log(chalk.white(`  • فریم‌ورک: ${this.config.frameworkType === 'typescript' ? 'Alphabets (TypeScript)' : 'Alphabet (JavaScript)'}`));
    console.log(chalk.white(`  • SSR: ${this.config.needsSSR ? '✅ فعال' : '❌ غیرفعال'}`));
    console.log(chalk.white(`  • CSS Framework: ${this.config.useGreatCSS ? '✅ Great CSS' : '❌ ندارد'}`));
    console.log(chalk.white(`  • State Management: ${this.config.needsStateManagement ? '✅ فعال' : '❌ ندارد'}`));
    console.log(chalk.white(`  • Backend: ${this.config.needsBackend ? '✅ PHP' : '❌ ندارد'}`));
    console.log(chalk.white(`  • PWA: ${this.config.isPWA ? '✅ فعال' : '❌ غیرفعال'}`));
    console.log(chalk.white(`  • پورت: ${this.config.port}`));
    
    console.log(chalk.cyan('\n💻 موفق باشید و کدنویسی لذت‌بخشی داشته باشید!'));
    console.log(chalk.cyan('='.repeat(50)));
  }
}

// CLI Commands
async function interactiveMode(): Promise<void> {
  console.log(chalk.cyan(ALPHABET_ART));
  console.log(chalk.cyan(`🚀 Alphabet CLI v${VERSION} - حالت تعاملی\n`));
  
  const answers = await inquirer.prompt(QUESTIONS);
  
  const config: ProjectConfig = {
    ...DEFAULT_CONFIG,
    ...answers
  };
  
  const generator = new ProjectGenerator(config);
  await generator.generate();
}

async function quickStart(projectName: string): Promise<void> {
  console.log(chalk.cyan(ALPHABET_ART));
  console.log(chalk.cyan(`🚀 Alphabet CLI v${VERSION} - Quick Start\n`));
  
  const config: ProjectConfig = {
    ...DEFAULT_CONFIG,
    projectName,
    author: 'Alphabet Developer',
    projectDescription: `A quick start project with ${projectName}`
  };
  
  const generator = new ProjectGenerator(config);
  await generator.generate();
}

// Command line interface
const argv = yargs(hideBin(process.argv))
  .scriptName('alphabet')
  .usage('$0 [command] [options]')
  .command('new [name]', 'ساخت پروژه جدید', (yargs) => {
    return yargs
      .positional('name', {
        describe: 'نام پروژه',
        type: 'string'
      });
  }, async (argv) => {
    if (argv.name) {
      await quickStart(argv.name as string);
    } else {
      await interactiveMode();
    }
  })
  .command('init', 'ساخت پروژه جدید (حالت تعاملی)', {}, async () => {
    await interactiveMode();
  })
  .command('serve', 'اجرای سرور توسعه', {}, () => {
    console.log('Starting development server...');
    // Implementation for serve command
  })
  .command('build', 'Build کردن پروژه', {}, () => {
    console.log('Building project...');
    // Implementation for build command
  })
  .command('test', 'اجرای تست‌ها', {}, () => {
    console.log('Running tests...');
    // Implementation for test command
  })
  .command('docs', 'ساخت مستندات', {}, () => {
    console.log('Generating documentation...');
    // Implementation for docs command
  })
  .command('examples', 'ساخت مثال‌ها', {}, () => {
    console.log('Generating examples...');
    // Implementation for examples command
  })
  .option('version', {
    alias: 'v',
    type: 'boolean',
    description: 'نمایش ورژن'
  })
  .option('help', {
    alias: 'h',
    type: 'boolean',
    description: 'نمایش راهنما'
  })
  .example('$0 new my-app', 'ساخت پروژه جدید به نام my-app')
  .example('$0 init', 'ساخت پروژه با حالت تعاملی')
  .example('$0 serve', 'اجرای سرور توسعه')
  .demandCommand(1, 'لطفا یک دستور وارد کنید')
  .strict()
  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .parse();

// Handle version flag
if (argv.version) {
  console.log(`Alphabet CLI v${VERSION}`);
  process.exit(0);
}

// Export for programmatic use
export { ProjectGenerator, interactiveMode, quickStart };