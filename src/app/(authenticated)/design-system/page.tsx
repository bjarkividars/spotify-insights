import { ThemeToggle } from "@/components/ThemeToggle";

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Design System</h1>
              <p className="text-foreground/70">A showcase of all design tokens and components</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60 mb-2 text-right">Theme</p>
              <ThemeToggle />
            </div>
          </div>
          <div className="card bg-primary/10 border-primary/20">
            <p className="text-sm text-foreground">
              💡 <strong>Tip:</strong> Toggle between light, system, and dark themes to see how all components adapt!
            </p>
          </div>
        </header>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="w-full h-20 bg-background rounded-lg mb-2 border"></div>
              <p className="text-sm font-medium">Background</p>
              <p className="text-xs text-foreground/60">bg-background</p>
            </div>
            <div className="card">
              <div className="w-full h-20 bg-foreground rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Foreground</p>
              <p className="text-xs text-foreground/60">bg-foreground</p>
            </div>
            <div className="card">
              <div className="w-full h-20 bg-primary rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-foreground/60">bg-primary</p>
            </div>
            <div className="card">
              <div className="w-full h-20 bg-secondary rounded-lg mb-2 border"></div>
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-foreground/60">bg-secondary</p>
            </div>
            <div className="card">
              <div className="w-full h-20 bg-success rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-foreground/60">bg-success</p>
            </div>
            <div className="card">
              <div className="w-full h-20 bg-warn rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Warn</p>
              <p className="text-xs text-foreground/60">bg-warn</p>
            </div>
            <div className="card">
              <div className="w-full h-20 bg-danger rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Danger</p>
              <p className="text-xs text-foreground/60">bg-danger</p>
            </div>
            <div className="card">
              <div className="w-full h-20 bg-muted rounded-lg mb-2 border"></div>
              <p className="text-sm font-medium">Muted</p>
              <p className="text-xs text-foreground/60">bg-muted</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Buttons</h2>
          <div className="card">
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
              <button className="btn-ghost">Ghost Button</button>
              <button className="btn-primary" disabled>Disabled</button>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Cards</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-2">Card Title</h3>
              <p className="text-sm text-foreground/60">
                This is a card component with default styling. It includes padding, rounded corners, and a subtle border.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-2">Card with Shadow</h3>
              <p className="text-sm text-foreground/60">
                Cards can be enhanced with shadows for depth and visual hierarchy.
              </p>
            </div>
            <div className="card shadow-soft">
              <h3 className="font-semibold mb-2">Soft Shadow</h3>
              <p className="text-sm text-foreground/60">
                This card uses the soft shadow utility for a gentle elevation effect.
              </p>
            </div>
          </div>
        </section>

        {/* Chips */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Chips</h2>
          <div className="card">
            <div className="flex flex-wrap gap-2">
              <span className="chip">Default Chip</span>
              <span className="chip">Another Chip</span>
              <span className="chip">Chip Component</span>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Typography</h2>
          <div className="card space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
              <p className="text-xs text-foreground/60 mt-1">text-4xl font-bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">Heading 2</h2>
              <p className="text-xs text-foreground/60 mt-1">text-3xl font-semibold</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-foreground">Heading 3</h3>
              <p className="text-xs text-foreground/60 mt-1">text-2xl font-semibold</p>
            </div>
            <div>
              <p className="text-base text-foreground">Body text - Regular paragraph text with default styling.</p>
              <p className="text-xs text-foreground/60 mt-1">text-base</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60">Small text - Used for captions and secondary information.</p>
              <p className="text-xs text-foreground/60 mt-1">text-sm text-foreground/60</p>
            </div>
          </div>
        </section>

        {/* Border Radius */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Border Radius</h2>
          <div className="card">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-lg mx-auto mb-2"></div>
                <p className="text-xs text-foreground/60">rounded-lg</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-xl mx-auto mb-2"></div>
                <p className="text-xs text-foreground/60">rounded-xl</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-2xl mx-auto mb-2"></div>
                <p className="text-xs text-foreground/60">rounded-2xl</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-foreground/60">rounded-full</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Spacing</h2>
          <div className="card">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-primary rounded"></div>
                <span className="text-sm">4px (gap-1)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary rounded"></div>
                <span className="text-sm">8px (gap-2)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded"></div>
                <span className="text-sm">16px (gap-4)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary rounded"></div>
                <span className="text-sm">24px (gap-6)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

