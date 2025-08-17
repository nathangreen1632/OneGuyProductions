import React from "react";
import type {EditOrderForm} from "./editOrderForm.types.ts";

export type HeaderInfo = {
  projectType: string;
  customerName: string;
  businessName: string;
  statusLabel: string;
  statusClass: string;
  placedAt: string;
  orderId: number;
};

export type ThreadMessage = {
  id: string;
  user: string;
  timestamp: string;
  message: string;
};

export interface Props {
  isOpen: boolean;
  onClose: () => void;
  header: HeaderInfo;
  messages: ThreadMessage[];
  reply: string;
  onChangeReply: (v: string) => void;
  onSend: () => Promise<void>;
  sending: boolean;
}

export interface DescriptionModalViewProps {
  title: string;
  titleId: string;
  children: React.ReactNode;

  onClose: () => void;
  onBackdropClick: () => void;
  onBackdropKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;

  panelRef: React.RefObject<HTMLDialogElement | null>;
}

export interface EditOrderModalViewProps {
  modalOpen: boolean;
  closeModal: () => void;
  form: EditOrderForm;
  loading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSave: () => void;
}