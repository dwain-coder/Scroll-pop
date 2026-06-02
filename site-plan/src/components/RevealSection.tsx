import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  /** Optional stagger delay (seconds) when several reveals sit close together. */
  delay?: number;
}

/**
 * A <section> that "loads in" cinematically as it scrolls into view: a gentle
 * rise + fade + focus-blur, played once. Honors prefers-reduced-motion by
 * rendering a plain, static section.
 */
export default function RevealSection({ children, className, delay = 0 }: RevealSectionProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <section className={className}>{children}</section>;
  }

  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}
