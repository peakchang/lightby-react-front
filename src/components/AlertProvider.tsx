"use client";

import { useAlertStore } from "@/stores/useAlertStore"; // 경로 확인!
import AlertModal from "@/components/AlertModal"; // 아까 만든 통합형 모달

export default function AlertProvider() {
    const { isOpen, type, title, description, confirmText, onConfirm, close } = useAlertStore();

    return (
        <AlertModal
            open={isOpen}
            type={type}
            title={title}
            description={description}
            confirmText={confirmText}
            onClose={close} // 배경이나 X버튼 클릭 시 닫기
            onConfirm={() => {
                if (onConfirm) onConfirm();
                close();
            }}
        />
    );
}