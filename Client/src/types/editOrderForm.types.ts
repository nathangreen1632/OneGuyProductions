import React from "react";

export type EditOrderForm = {
  description: string;
  timeline: string;
  budget: string;
  projectType: string;
  businessName: string;
};

export interface EditOrderModalViewProps {
  modalOpen: boolean;
  closeModal: () => void;
  form: EditOrderForm;
  loading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSave: () => void;
}