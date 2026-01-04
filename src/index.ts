import { EasySewa } from './easySewa';

export * from './easySewa';
export * from './types'


// Attach to window for HTML usage
if (typeof window !== "undefined") {
    // Expose the class globally
    (window as any).EasySewa = EasySewa;
}