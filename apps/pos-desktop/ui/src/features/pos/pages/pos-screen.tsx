import React from 'react'

export const PosScreen: React.FC = () => {
  return (
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      {/* 1. Top Navigation Bar Area */}
      <header className="flex h-16 w-full items-center justify-between border-b px-4">
        <div className="font-bold">Terencio POS</div>
        <div className="text-sm text-muted-foreground">Top Bar Placeholder</div>
      </header>

      {/* 2. Main Workspace */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* Left: Transaction/Cart Area (35%) */}
        <aside className="w-[400px] flex flex-col border-r bg-muted/10">
          <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground border-dashed border-2 m-4 rounded-lg">
            [Cart Component Here]
          </div>
          <div className="h-[200px] border-t p-4 flex items-center justify-center text-muted-foreground bg-background">
            [Totals & Checkout Actions]
          </div>
        </aside>

        {/* Right: Product Grid/Catalog (Rest) */}
        <section className="flex-1 flex flex-col bg-muted/5">
          <div className="h-14 border-b flex items-center px-4">
            <span className="text-muted-foreground">[Category/Search Bar]</span>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground border-dashed border-2 m-4 rounded-lg">
            [Product Grid Component Here]
          </div>
        </section>

      </main>
    </div>
  )
}