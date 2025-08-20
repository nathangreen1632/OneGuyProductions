import React, {useState, useEffect, useRef, type RefObject} from 'react';
import toast from 'react-hot-toast';
import { useEditOrderStore } from '../store/useEditOrder.store';
import EditOrderModalView from '../jsx/modalView/editOrderModalView';
import type { EditOrderForm } from '../types/editOrderForm.types';

const LOG_PREFIX = 'EditOrderModal';

interface ApiErrorBody {
  error?: string;
  message?: string;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

async function readJsonSafe(res: Response): Promise<ApiErrorBody | null> {
  try {
    const text = await res.text();
    if (!isNonEmptyString(text)) return null;

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        const maybeError = parsed as Partial<ApiErrorBody>;
        return {
          error: isNonEmptyString(maybeError.error) ? maybeError.error : undefined,
          message: isNonEmptyString(maybeError.message) ? maybeError.message : undefined,
        };
      }
      return { message: text };
    } catch {
      return { message: text };
    }
  } catch (err) {
    console.error(`${LOG_PREFIX}: failed to read response body`, err);
    return null;
  }
}

function errorMessageFromStatus(res: Response, body: ApiErrorBody | null): string {
  if (body?.error && isNonEmptyString(body.error)) return body.error;
  if (body?.message && isNonEmptyString(body.message)) return body.message;

  if (res.status >= 500) return 'The server encountered an error while updating the order.';
  if (res.status === 404) return 'Order not found.';
  if (res.status === 401 || res.status === 403) return 'You do not have permission to update this order.';
  if (res.status === 400) return 'Invalid data. Please review your changes and try again.';
  return 'Failed to update order.';
}

export default function EditOrderModal(): React.ReactElement | null {
  const { modalOpen, targetOrder, closeModal, refreshOrders } = useEditOrderStore();
  const [loading, setLoading] = useState<boolean>(false);

  const [form, setForm] = useState<EditOrderForm>({
    description: '',
    timeline: '',
    budget: '',
    projectType: '',
    businessName: '',
  });

  const isMountedRef: RefObject<boolean> = useRef(true);
  useEffect((): () => void => {
    isMountedRef.current = true;
    return (): void => { isMountedRef.current = false; };
  }, []);

  useEffect((): void => {
    try {
      if (!targetOrder) return;
      setForm({
        description: targetOrder.description ?? '',
        timeline: targetOrder.timeline ?? '',
        budget: targetOrder.budget ?? '',
        projectType: targetOrder.projectType ?? '',
        businessName: targetOrder.businessName ?? '',
      });
    } catch (err) {
      console.error(`${LOG_PREFIX}: failed to populate form from targetOrder`, err);
    }
  }, [targetOrder]);

  const handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave: () => Promise<void> = async (): Promise<void> => {
    if (loading) return;
    if (!targetOrder) {
      console.warn(`${LOG_PREFIX}: handleSave called without targetOrder`);
      toast.error('No order selected to update.');
      return;
    }

    setLoading(true);

    try {
      const payload: EditOrderForm = {
        description: form.description ?? '',
        timeline: form.timeline ?? '',
        budget: form.budget ?? '',
        projectType: form.projectType ?? '',
        businessName: form.businessName ?? '',
      };

      const res: Response = await fetch(`/api/order/${targetOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const body: ApiErrorBody | null = await readJsonSafe(res);

      if (res.ok) {
        toast.success('Order updated successfully.');
        try {
          closeModal();
        } catch (err) {
          console.error(`${LOG_PREFIX}: closeModal threw`, err);
        }
        try {
          refreshOrders();
        } catch (err) {
          console.error(`${LOG_PREFIX}: refreshOrders failed`, err);
          toast('Updated, but could not refresh the list. Please reload.', { icon: 'ℹ️' });
        }
        return;
      }

      const msg: string = errorMessageFromStatus(res, body);
      toast.error(msg);
      console.warn(`${LOG_PREFIX}: update failed`, { status: res.status, msg, body });
    } catch (err) {
      console.error(`${LOG_PREFIX}: network or unexpected error`, err);

      const offlineHint = typeof navigator !== 'undefined' && navigator && 'onLine' in navigator && (navigator).onLine === false
        ? ' You appear to be offline.'
        : '';
      toast.error(`Unable to reach the server.${offlineHint}`);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <EditOrderModalView
      modalOpen={modalOpen}
      closeModal={closeModal}
      form={form}
      loading={loading}
      handleChange={handleChange}
      handleSave={handleSave}
    />
  );
}
