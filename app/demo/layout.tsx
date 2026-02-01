import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PatchPilot Demo App',
  description: 'Demo application with intentional bugs for PatchPilot testing',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="demo-app">
      <header style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0 }}>PatchPilot Demo Store</h1>
        <nav style={{ marginTop: '10px' }}>
          <a href="/demo" style={{ marginRight: '15px' }}>Home</a>
          <a href="/demo/cart" style={{ marginRight: '15px' }}>Cart</a>
          <a href="/demo/signup">Sign Up</a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
