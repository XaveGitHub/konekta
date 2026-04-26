import { cn } from '@/lib/utils';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

const textVariants = cva(
  cn(
    'text-foreground text-base font-inter',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        h1: cn(
          'text-center text-4xl font-inter-bold tracking-tight',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h2: cn(
          'border-border border-b pb-2 text-3xl font-inter-semibold tracking-tight',
          Platform.select({ web: 'scroll-m-20 first:mt-0' })
        ),
        h3: cn(
          'text-2xl font-inter-semibold tracking-tight',
          Platform.select({ web: 'scroll-m-20' }),
        ),
        h4: cn(
          'text-xl font-inter-semibold tracking-tight',
          Platform.select({ web: 'scroll-m-20' }),
        ),
        p: 'mt-3 leading-7 sm:mt-6',
        blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
        code: cn(
          'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'
        ),
        lead: 'text-muted-foreground text-xl',
        large: 'text-lg font-inter-semibold',
        small: 'text-sm font-inter-medium leading-none',
        muted: 'text-muted-foreground text-sm',
        /** Large nav / settings screen title */
        screenTitle:
          'text-3xl font-inter-semibold tracking-tight text-foreground',
        /** Sheet & dialog titles (Unlock, Mute, add contact steps) */
        sheetTitle: 'text-xl font-inter-semibold tracking-tight text-foreground',
        /** Sheet hero / dialog supporting copy */
        sheetDescription:
          'text-base font-inter-medium leading-snug text-muted-foreground',
        /** List row primary line (inbox, menu label) */
        listTitle:
          'text-[17px] font-inter-semibold tracking-tight text-foreground',
        /** List row secondary line */
        listSubtitle:
          'text-sm font-inter-medium leading-snug text-muted-foreground',
        /** Tappable sheet rows (mute duration, overflow actions) */
        listBody: 'text-[17px] font-inter-medium text-foreground',
        /** Tiny uppercase label (sponsored, section kicker) */
        overline:
          'text-[10px] font-inter-bold uppercase tracking-widest text-muted-foreground',
        /** Lowercase section header (profile blocks) */
        sectionLabel:
          'text-[13px] font-inter-medium lowercase tracking-tight text-muted-foreground/70',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  TextVariantProps &
  React.RefAttributes<RNText> & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
