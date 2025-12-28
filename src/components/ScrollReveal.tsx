import { forwardRef, ReactNode, useCallback } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  ({ children, className, delay = 0, direction = "up" }, forwardedRef) => {
    const { ref: animationRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        // Set the animation ref
        (animationRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        
        // Set the forwarded ref
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [animationRef, forwardedRef]
    );

    const getTransform = () => {
      switch (direction) {
        case "up": return "translateY(40px)";
        case "down": return "translateY(-40px)";
        case "left": return "translateX(40px)";
        case "right": return "translateX(-40px)";
        case "scale": return "scale(0.95)";
        default: return "translateY(40px)";
      }
    };

    return (
      <div
        ref={setRefs}
        className={cn(className)}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0) translateX(0) scale(1)" : getTransform(),
          transition: `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
        }}
      >
        {children}
      </div>
    );
  }
);

ScrollReveal.displayName = "ScrollReveal";

export default ScrollReveal;
