import React, {type RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type { Order } from '../types/order.types';
import { useOrderStore } from '../store/useOrderStore';
import { useThreadModalStore } from '../store/useThreadModalStore';
import ThreadReplyModal from '../components/ThreadReplyModalLogic';
import OrderTimelineView, { type OrderTimelineViewProps } from '../jsx/orderTimelineView';

function useExpandedSet(): {
  expanded: Set<number>;
  isExpanded: (id: number) => boolean;
  toggle: (id: number) => void;
  close: (id: number) => void;
} {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const isExpanded: (id: number) => boolean = useCallback((id: number): boolean => expanded.has(id), [expanded]);

  const toggle: (id: number) => void = useCallback((id: number): void => {
    setExpanded((prev: Set<number>): Set<number> => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const close: (id: number) => void = useCallback((id: number): void => {
    setExpanded((prev: Set<number>): Set<number> => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return { expanded, isExpanded, toggle, close };
}

export default function OrderTimelineLogic(): React.ReactElement {
  const { orders } = useOrderStore() as { orders: Order[] };
  const { open: openThreadModal } = useThreadModalStore();

  const { expanded, isExpanded, toggle, close } = useExpandedSet();

  const cardRefs: RefObject<Map<number, HTMLDivElement | null>> = useRef<Map<number, HTMLDivElement | null>>(new Map());

  const onCardRef: (id: number, el: HTMLDivElement | null) => void = useCallback((id: number, el: HTMLDivElement | null): void => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  useEffect((): () => void => {
    function onPointerDown(e: PointerEvent): void {
      const target = e.target as Node;
      expanded.forEach((id: number): void => {
        const el: HTMLDivElement | null | undefined = cardRefs.current.get(id);
        if (el && !el.contains(target)) close(id);
      });
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded, close]);

  const viewProps: OrderTimelineViewProps = useMemo(
    (): OrderTimelineViewProps => ({
      orders,
      isExpanded,
      toggle,
      onCardRef,
      onOpenThread: (orderId: number): void => openThreadModal(orderId),
    }),
    [isExpanded, toggle, onCardRef, openThreadModal]
  );

  return (
    <>
      <OrderTimelineView {...viewProps} />
      <ThreadReplyModal />
    </>
  );
}
