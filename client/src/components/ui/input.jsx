import * as React from 'react';
import { cn } from '@/lib/utils';
function Input({
  className,
  type,
  ...props
}) {
  return <input type={type} data-slot="input" className={cn('flex h-10 w-full rounded-full border border-white/[0.08] bg-[#09090c]/80 px-4 py-2 text-sm text-zinc-200 shadow-inner transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:border-[var(--signal)] focus-visible:ring-2 focus-visible:ring-[var(--signal)]/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-white/[0.15]', className)} {...props} />;
}
export { Input };