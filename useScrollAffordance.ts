import { useState, useEffect, RefObject, useCallback } from 'react';

export function useScrollAffordance(scrollableRef: RefObject<HTMLElement>) {
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const handleScroll = useCallback(() => {
    const element = scrollableRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    // Add a small tolerance (e.g., 1px) for floating point inaccuracies
    const isAtTop = scrollTop <= 1;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 1;
    
    setShowTopShadow(!isAtTop);
    setShowBottomShadow(!isAtBottom && scrollHeight > clientHeight); // Also check if content is actually scrollable

  }, [scrollableRef]);

  useEffect(() => {
    const element = scrollableRef.current;
    if (!element) return;

    // Initial check
    handleScroll();

    element.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check on resize if content changes affecting scrollHeight
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(element);
    
    // For dynamic content changes (e.g., adding/removing todos)
    const mutationObserver = new MutationObserver(handleScroll);
    mutationObserver.observe(element, { childList: true, subtree: true, characterData: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      resizeObserver.unobserve(element);
      mutationObserver.disconnect();
    };
  }, [scrollableRef, handleScroll]);

  return { showTopShadow, showBottomShadow };
}
