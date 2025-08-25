import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, type NavigateFunction } from 'react-router-dom';
import AdminTimeline from '../../components/admin/AdminTimeline';
import AdminStatusChips from '../../components/admin/AdminStatusChips';
import AdminComposer from '../../components/admin/AdminComposer';
import { useAdminStore } from '../../store/useAdmin.store';
import type { OrderThreadDto, TDetailsType } from '../../types/admin.types';
import type { OrderStatus } from '../../types/order.types';

import InvoiceEditorLogic from '../../components/admin/InvoiceEditorLogic.tsx';

const LOG_PREFIX = 'AdminOrderDetailPage';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function offlineHint(): string {
  try {
    return typeof navigator !== 'undefined' && 'onLine' in navigator && (navigator as any).onLine
      ? ' You appear to be offline.'
      : '';
  } catch {
    return '';
  }
}

function safeNavigate(nav: NavigateFunction, to: string | number): void {
  try {
    nav(to as any);
  } catch (err) {
    console.error(`${LOG_PREFIX}: navigation failed`, err);
    toast('Navigation failed. Please try again or use your browser back button.', { icon: 'ℹ️' });
  }
}

function statusClass(s: OrderStatus): string {
  switch (s) {
    case 'complete':        return 'bg-emerald-600 text-white';
    case 'cancelled':       return 'bg-red-600 text-white';
    case 'in-progress':     return 'bg-yellow-500 text-black';
    case 'needs-feedback':  return 'bg-orange-600 text-white';
    case 'pending':
    default:                return 'bg-sky-600 text-white';
  }
}

function toDetails(o: unknown): TDetailsType {
  try {
    const x = (o ?? {}) as Record<string, unknown>;
    const name: string = (x.customerName as string) ?? (x.name as string) ?? '';
    const email: string = (x.customerEmail as string) ?? (x.email as string) ?? '';
    const projectType: string = (x.projectType as string) ?? '';
    const status: OrderStatus = ((x.status as OrderStatus) ?? 'pending');
    const timeline: string = (x.timeline as string) ?? '';
    const description: string = (x.description as string) ?? '';
    const businessName: string = (x.businessName as string) ?? '';
    const budget: string = (x.budget as string) ?? '';
    const customerId: number | null = typeof x.customerId === 'number' ? x.customerId : null;
    return { name, email, projectType, status, timeline, description, businessName, budget, customerId };
  } catch (err) {
    console.error(`${LOG_PREFIX}: failed to normalize order details`, err);
    return { name: '', email: '', projectType: '', status: 'pending', timeline: '', description: '', businessName: '', budget: '', customerId: null };
  }
}

export default function AdminOrderDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const orderId: number = Number(id ?? NaN);
  const nav: NavigateFunction = useNavigate();

  const { threads, fetchThread, sendUpdate } = useAdminStore();

  let data: OrderThreadDto | undefined;
  try {
    data = Number.isFinite(orderId)
      ? (threads[orderId] ?? (threads as Record<string, OrderThreadDto | undefined>)[String(orderId)])
      : undefined;
  } catch (err) {
    console.error(`${LOG_PREFIX}: failed to read thread from store`, err);
  }

  const [sending, setSending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!data);

  useEffect((): (() => void) => {
    let active: boolean = true;

    (async (): Promise<void> => {
      if (!Number.isFinite(orderId) || orderId <= 0) return;
      if (data) return;

      setLoading(true);
      try {
        await fetchThread(orderId);
      } catch (err) {
        console.error(`${LOG_PREFIX}: fetchThread failed`, err);
        toast.error(`Unable to load order #${orderId}.${offlineHint()}`);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return (): void => { active = false; };

  }, [orderId, fetchThread]);

  const details: TDetailsType = toDetails(data?.order);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-text)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
        <span className="text-[var(--theme-border-red)]">Invalid order id.</span>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-text)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--theme-card)]/60" />
        <div className="mt-3 h-3 w-48 animate-pulse rounded bg-[var(--theme-card)]/40" />
      </div>
    );
  }

  if (!data?.order) {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-text)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
        <span>Could not load this order.</span>
        <button
          className="ml-3 inline-flex items-center rounded-2xl px-3 py-1 text-[var(--theme-text)] transition hover:bg-[var(--theme-card-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
          onClick={(): void => safeNavigate(nav, '/admin/orders')}
        >
          Back to orders
        </button>
      </div>
    );
  }

  const canPost: boolean = Boolean(data.canPost);

  return (
    <div
      className="grid gap-4 md:grid-cols-5 text-[var(--theme-text)] items-start [&&>*]:min-w-0"
    >
      <div className="md:col-span-5">
        <button
          onClick={(): void => safeNavigate(nav, -1)}
          aria-label="Back to orders"
          className="
            inline-flex items-center gap-2 rounded-lg
            bg-[var(--theme-button)] px-3 py-2 text-sm
            text-[var(--theme-text-white)] hover:opacity-90
            focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
          "
        >
          <span>←</span>
          <span>Back to Orders</span>
        </button>
      </div>

      {/* TIMELINE COLUMN */}
      <section
        className="
          md:col-span-2 rounded-2xl
          bg-[var(--theme-bg)]
          shadow-[0_4px_14px_0_var(--theme-shadow)]
          transition-colors duration-200
          p-3 sm:p-4
          w-full
          self-stretch
        "
      >
        <div className="mb-3 h-0.5 w-full" />
        <AdminTimeline updates={data.updates ?? []} />
      </section>

      {/* ASIDE COLUMN */}
      <aside className="md:col-span-3 space-y-3 w-full [&&>*]:w-full [&&>*]:self-stretch">
        <div className="rounded-2xl bg-[var(--theme-surface)] shadow-[0_4px_14px_0_var(--theme-shadow)] p-3 sm:p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm opacity-70">Order</div>
              <div className="text-lg font-semibold truncate">#{data.order.id}</div>
            </div>
            <span className={['text-xs px-2 py-1 rounded-full', statusClass(details.status)].join(' ')}>
              {String(details.status).replace('-', ' ')}
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="truncate">
              <span className="opacity-70 mr-1">Customer:</span>
              <span className="font-medium">{details.name || details.email || '—'}</span>
              {details.name && details.email && <span className="opacity-70"> · {details.email}</span>}
            </div>

            {isNonEmptyString(details.businessName) && (
              <div className="truncate">
                <span className="opacity-70 mr-1">Business:</span>
                <span className="font-medium">{details.businessName}</span>
              </div>
            )}

            <div className="truncate">
              <span className="opacity-70 mr-1">Project Type:</span>
              <span className="font-medium">{details.projectType || '—'}</span>
            </div>

            <div className="truncate">
              <span className="opacity-70 mr-1">Budget:</span>
              <span className="font-medium">{details.budget || '—'}</span>
            </div>

            <div className="truncate">
              <span className="opacity-70 mr-1">Timeline:</span>
              <span className="font-medium">{details.timeline || '—'}</span>
            </div>

            <div className="truncate">
              <span className="opacity-70 mr-1">Customer ID:</span>
              <span className="font-medium">{details.customerId ?? '—'}</span>
            </div>
          </div>

          <div>
            <div className="opacity-70 mb-1 text-sm">Description</div>
            <div className="rounded-lg bg-[var(--theme-bg)]/60 p-2 text-sm whitespace-pre-wrap">
              {details.description || '—'}
            </div>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            bg-[var(--theme-surface)]
            shadow-[0_4px_14px_0_var(--theme-shadow)]
            p-3 sm:p-4
            w-full
          "
        >
          <AdminStatusChips orderId={data.order.id} status={data.order.status} />
        </div>

        <div
          className="
            rounded-2xl
            bg-[var(--theme-bg)]
            shadow-[0_4px_14px_0_var(--theme-shadow)]
            p-3 sm:p-4
            transition-colors duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--theme-focus)]/30
            w-full
          "
        >
          <AdminComposer
            disabled={!canPost || sending}
            onSend={async (body: string, requiresResponse: boolean): Promise<boolean> => {
              setSending(true);
              try {
                const ok: boolean = await sendUpdate(orderId, body, requiresResponse);
                if (!ok) toast.error('Failed to post update.');
                return ok;
              } catch (err) {
                console.error(`${LOG_PREFIX}: sendUpdate failed`, err);
                toast.error(`Unable to post update.${offlineHint()}`);
                return false;
              } finally {
                setSending(false);
              }
            }}
          />
        </div>

        <div className="w-full">
          <InvoiceEditorLogic
            orderId={data.order.id}
            initialItems={(data.order as any).items ?? []}
            initialTaxRate={Number((data.order as any).taxRate ?? 0)}
            initialDiscountCents={Number((data.order as any).discountCents ?? 0)}
            initialShippingCents={Number((data.order as any).shippingCents ?? 0)}
          />
        </div>
      </aside>
    </div>
  );
}
