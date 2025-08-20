import React, {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import type { Order } from '../types/order.types';
import { useOrderStore } from '../store/useOrder.store';
import { useThreadModalStore } from '../store/useThreadModal.store';
import ThreadReplyModal from '../components/ThreadReplyModalLogic';
import OrderTimelineView, { type OrderTimelineViewProps } from '../jsx/orderTimelineView';

function useExpandedSet(): {
  expanded: Set<number>;
  isExpanded: (id: number) => boolean;
  toggle: (id: number) => void;
  close: (id: number) => void;
} {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const isExpanded: (id: number) => boolean = useCallback(
    (id: number): boolean => {
      try {
        return expanded.has(id);
      } catch (err) {
        console.error('OrderTimeline: isExpanded check failed', err);
        return false;
      }
    },
    [expanded]
  );

  const toggle: (id: number) => void = useCallback((id: number): void => {
    try {
      if (!Number.isFinite(id)) {
        console.warn('OrderTimeline: toggle called with invalid id', id);
        toast.error('Invalid item.');
        return;
      }
      setExpanded((prev: Set<number>): Set<number> => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    } catch (err) {
      console.error('OrderTimeline: toggle failed', err);
      toast.error('Could not toggle the card.');
    }
  }, []);

  const close: (id: number) => void = useCallback((id: number): void => {
    try {
      if (!Number.isFinite(id)) return;
      setExpanded((prev: Set<number>): Set<number> => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error('OrderTimeline: close failed', err);
    }
  }, []);

  return { expanded, isExpanded, toggle, close };
}

export default function OrderTimelineLogic(): React.ReactElement {
  const storeState = useOrderStore() as { orders?: Order[] };
  const orders: Order[] = Array.isArray(storeState?.orders) ? storeState.orders : [];

  const modalStore = useThreadModalStore();
  const openThreadModal: ((OrderId: number) => void) | undefined =
    typeof modalStore?.open === 'function'
      ? (modalStore.open as (orderId: number) => void)
      : undefined;

  const { expanded, isExpanded, toggle, close } = useExpandedSet();

  const cardRefs: RefObject<Map<number, HTMLDivElement | null>> =
    useRef<Map<number, HTMLDivElement | null>>(new Map());

  const onCardRef: (id: number, el: HTMLDivElement | null) => void = useCallback((id: number, el: HTMLDivElement | null): void => {
    try {
      if (!Number.isFinite(id)) {
        console.warn('OrderTimeline: onCardRef got invalid id', id);
        return;
      }
      const map: Map<number, HTMLDivElement | null> = cardRefs.current;
      if (!map) return;
      if (el) map.set(id, el);
      else map.delete(id);
    } catch (err) {
      console.error('OrderTimeline: onCardRef failed', err);
    }
  }, []);

  useEffect((): (() => void) => {
    const onPointerDown: (e: PointerEvent) => void = (e: PointerEvent): void => {
      try {
        if (!expanded || expanded.size === 0) return;

        const target = e.target as Node | null;
        expanded.forEach((id: number): void => {
          try {
            const el: HTMLDivElement | null = cardRefs.current?.get(id) ?? null;
            if (el && target && !el.contains(target)) close(id);
          } catch (err) {
            console.error('OrderTimeline: error processing outside click for id', id, err);
          }
        });
      } catch (err) {
        console.error('OrderTimeline: onPointerDown handler failed', err);
      }
    };

    try {
      document.addEventListener('pointerdown', onPointerDown);
    } catch (err) {
      console.error('OrderTimeline: failed to add pointerdown listener', err);
      toast.error('Could not initialize interactions.');
    }

    return (): void => {
      try {
        document.removeEventListener('pointerdown', onPointerDown);
      } catch (err) {
        console.warn('OrderTimeline: failed to remove pointerdown listener', err);
      }
    };
  }, [expanded, close]);

  const viewProps: OrderTimelineViewProps = useMemo((): OrderTimelineViewProps => {
    try {
      return {
        orders,
        isExpanded,
        toggle,
        onCardRef,
        onOpenThread: (orderId: number): void => {
          try {
            if (!Number.isFinite(orderId) || orderId <= 0) {
              console.warn('OrderTimeline: invalid orderId for thread modal', orderId);
              toast.error('Invalid order id.');
              return;
            }
            if (!openThreadModal) {
              console.error('OrderTimeline: openThreadModal is unavailable');
              toast.error('Unable to open the thread.');
              return;
            }
            openThreadModal(orderId);
          } catch (err) {
            console.error('OrderTimeline: failed to open thread modal', err);
            toast.error('Could not open the thread.');
          }
        },
      };
    } catch (err) {
      console.error('OrderTimeline: building view props failed', err);
      toast.error('Unable to render the timeline.');
      return {
        orders: [],
        isExpanded: (): boolean => false,
        toggle: (): void => {},
        onCardRef: (): void => {},
        onOpenThread: (): void => {},
      };
    }
  }, [isExpanded, toggle, onCardRef]);

  return (
    <>
      <OrderTimelineView {...viewProps} />
      <ThreadReplyModal />
    </>
  );
}
