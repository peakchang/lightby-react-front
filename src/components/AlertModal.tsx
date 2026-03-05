"use client";

import { useEffect } from "react";
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertModalProps {
    open: boolean;            // 모달 열림 상태
    type: AlertType;
    title: string;
    description?: React.ReactNode;
    confirmText?: string;
    onConfirm: () => void;
    onClose?: () => void;     // 닫기 함수 (배경 클릭이나 X 버튼용)
}

const typeStyles = {
    success: {
        icon: <FiCheckCircle />,
        bg: "bg-green-100",
        text: "text-green-600",
        button: "bg-green-600 hover:bg-green-700",
    },
    error: {
        icon: <FiAlertTriangle />,
        bg: "bg-red-100",
        text: "text-red-600",
        button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
        icon: <FiAlertTriangle />,
        bg: "bg-yellow-100",
        text: "text-yellow-600",
        button: "bg-yellow-500 hover:bg-yellow-600",
    },
    info: {
        icon: <FiInfo />,
        bg: "bg-blue-100",
        text: "text-blue-600",
        button: "bg-blue-600 hover:bg-blue-700",
    },
};

export default function AlertModal({
    open,
    type,
    title,
    description,
    confirmText = "확인",
    onConfirm,
    onClose,
}: AlertModalProps) {
    const style = typeStyles[type];

    // 스크롤 방지 및 ESC 키 제어
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === "Escape" && onClose) onClose();
            };
            window.addEventListener("keydown", handleEsc);
            return () => {
                document.body.style.overflow = "auto";
                window.removeEventListener("keydown", handleEsc);
            };
        }
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* 배경 레이어 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* 컨텐츠 박스 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        {/* 상단 닫기(X) 버튼 - 필요시에만 onClose 전달 시 노출 */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
                            >
                                <FiX size={20} />
                            </button>
                        )}

                        <div className="flex flex-col items-center text-center">
                            {/* 아이콘 */}
                            <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${style.bg}`}>
                                <div className={`text-4xl ${style.text}`}>
                                    {style.icon}
                                </div>
                            </div>

                            {/* 텍스트 영역 */}
                            <h2 className="mb-2 text-xl font-bold text-gray-800">
                                {title}
                            </h2>
                            {description && (
                                <div className="mb-6 text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                                    {description}
                                </div>
                            )}

                            {/* 확인 버튼 */}
                            <button
                                onClick={() => {
                                    onConfirm();
                                    if (onClose) onClose(); // 확인 클릭 시 자동으로 닫히게 하려면 추가
                                }}
                                className={`w-full rounded-xl py-3 text-white font-semibold shadow-lg transition active:scale-95 ${style.button}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}