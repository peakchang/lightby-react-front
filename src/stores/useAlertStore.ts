import { create } from "zustand";
import { ReactNode } from "react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertOptions {
    type: AlertType;
    title: string;
    description?: ReactNode;
    confirmText?: string;
    onConfirm?: () => void;
}

interface AlertState extends AlertOptions {
    isOpen: boolean;
    open: (options: AlertOptions) => void;
    close: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    isOpen: false,
    type: "info",
    title: "",
    description: "",
    confirmText: "확인",
    onConfirm: undefined,

    // 모달 열기 함수
    open: (options) => set({ ...options, isOpen: true }),

    // 모달 닫기 함수
    close: () => set({ isOpen: false }),
}));