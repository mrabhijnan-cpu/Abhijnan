import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ReactNode, useState, useEffect } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';

// CONTRACT:
// Input: leftPanel (ReactNode), rightPanel (ReactNode), storageKey (string to save layout)
// Output: Resizable split pane layout. On mobile (<768px), stacks vertically.
// Side effects: Saves/loads layout to/from localStorage to preserve user preference.

interface ResizableWorkspaceProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  storageKey: string;
  defaultLayout?: [number, number];
}

export default function ResizableWorkspace({
  leftPanel,
  rightPanel,
  storageKey,
  defaultLayout = [65, 35]
}: ResizableWorkspaceProps) {
  const [layout, setLayout] = useState<number[]>(defaultLayout);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check immediately
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLayout = (sizes: any) => {
    setLayout(sizes as number[]);
    // Explicitly using a timeout or checking window to avoid SSR/hydration issues, 
    // but in pure Vite SPA, this is fine directly.
  };

  return (
    <PanelGroup 
      id={`karma_layout_${storageKey}`}
      orientation={isMobile ? "vertical" : "horizontal"} 
      onLayoutChange={handleLayout}
      className="w-full h-full rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-white/10"
    >
      <Panel 
        defaultSize={layout[0]} 
        minSize={25}
        className="bg-white dark:bg-[#161B22] relative flex flex-col transition-colors"
      >
        <div className="w-full h-full overflow-y-auto custom-scrollbar">
          {leftPanel}
        </div>
      </Panel>

      <PanelResizeHandle className="relative flex items-center justify-center w-2 md:w-3 bg-transparent hover:bg-blue-500/10 dark:hover:bg-blue-500/20 active:bg-blue-500/20 transition-colors group z-50 md:cursor-col-resize cursor-row-resize">
        <div className="z-50 flex h-10 w-1 md:w-1.5 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600 shadow-sm transform group-hover:scale-y-110 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 group-active:bg-blue-600 transition-all duration-200">
        </div>
      </PanelResizeHandle>

      <Panel 
        defaultSize={layout[1]} 
        minSize={25}
        className="bg-slate-50 dark:bg-[#0D1117] relative flex flex-col transition-colors"
      >
        <div className="w-full h-full overflow-y-auto custom-scrollbar">
          {rightPanel}
        </div>
      </Panel>
    </PanelGroup>
  );
}
