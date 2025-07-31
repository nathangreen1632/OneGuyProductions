import { type StoreApi, type UseBoundStore } from 'zustand';

export type BoundStore<T> = UseBoundStore<StoreApi<T>>;
