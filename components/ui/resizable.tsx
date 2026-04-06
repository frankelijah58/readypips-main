'use client';

import { GripVertical } from 'lucide-react';
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type SeparatorProps,
} from 'react-resizable-panels';

import { cn } from '@/lib/utils';

type ResizablePanelGroupProps = GroupProps & {
  /** @deprecated Prefer `orientation` from react-resizable-panels v4. */
  direction?: 'horizontal' | 'vertical';
};

const ResizablePanelGroup = ({
  className,
  direction,
  orientation: orientationProp,
  ...props
}: ResizablePanelGroupProps) => {
  const orientation =
    orientationProp ?? (direction === 'vertical' ? 'vertical' : undefined);
  return (
    <Group
      orientation={orientation}
      className={cn('h-full w-full', className)}
      {...props}
    />
  );
};

const ResizablePanel = Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: SeparatorProps & { withHandle?: boolean }) => (
  <Separator
    className={cn(
      'relative flex w-px shrink-0 items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
      '[&[aria-orientation=horizontal]]:h-px [&[aria-orientation=horizontal]]:w-full [&[aria-orientation=horizontal]]:after:left-0 [&[aria-orientation=horizontal]]:after:h-1 [&[aria-orientation=horizontal]]:after:w-full [&[aria-orientation=horizontal]]:after:-translate-y-1/2 [&[aria-orientation=horizontal]]:after:translate-x-0 [&[aria-orientation=horizontal]>div]:rotate-90',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
