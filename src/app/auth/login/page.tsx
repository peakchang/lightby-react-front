"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useAlertStore } from '@/stores/useAlertStore';
import { BACK_API } from "@/lib/constants";
import axios from "axios";

export default function LoginPage() {
    const router = useRouter();
    const alert = useAlertStore();

    const [userIdVal, setUserId] = useState("");
    const [passwordVal, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false); // 로그인 시도 시작 (버튼 비활성화)
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); // 로그인 시작 상태값 변경
        setErrorMessage(""); // 일단 에러 메세지는 초기화 (이전에 되어 있을수 있으니)

        try {
            const res = await axios.post(`${BACK_API}/auth/login`,
                { user_id: userIdVal, password: passwordVal },
                { withCredentials: true }
            );

            if (res.status == 200) {
                const timer = setTimeout(() => {
                    if (typeof alert.close === "function") {
                        alert.close(); // 1. 모달을 닫는다
                    }
                    location.href = '/';
                }, 2500)
                alert.open({
                    type: "success",
                    title: "로그인 성공",
                    description: (
                        <>
                            <p>번개 분양에 오신걸 환영합니다.</p>
                            <p>3초 뒤 메인으로 자동 이동합니다.</p>
                        </>
                    ),
                    onConfirm: () => {
                        clearTimeout(timer); // ✅ 버튼 클릭 시 타이머 취소 (중복 실행 방지)
                        location.href = '/';
                    }
                })
            }

        } catch (err: any) {
            console.error(err.response.data.message);
            setErrorMessage(err.response.data.message);
            setIsSubmitting(false);

        }
    };

    function kakaoLoginHandle() {
        const restApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
        const kakaoUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${restApiKey}&redirect_uri=${redirectUri}&response_type=code`;
        window.location.href = kakaoUrl;
    }

    return (
        <div className="w-full max-w-130 min-h-screen mx-auto py-8 px-2 mt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-10 text-center">

                    <Link href="/">
                        <div className='mb-4'>
                            <Image className='mx-auto' src="/logo.png" width={192} height={100} alt='번개분양 로고'></Image>
                        </div>
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-900 font-nanum-square">
                        로그인
                    </h1>
                    {/* <p className="text-gray-500 mt-2">
                        번개분양의 새로운 가족이 되어주세요!
                    </p> */}
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* 이메일 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            이메일 주소
                        </label>
                        <input
                            type="input"
                            value={userIdVal}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                            className="base-input"
                            placeholder="아이디를 입력하세요"
                        />
                    </div>

                    {/* 비밀번호 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={passwordVal}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="base-input"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* 에러 메시지 애니메이션 */}
                    <AnimatePresence>
                        {errorMessage && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100"
                            >
                                ⚠️ {errorMessage}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* 로그인 버튼 */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${isSubmitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200"
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                인증 중...
                            </span>
                        ) : (
                            "로그인"
                        )}
                    </motion.button>
                </form>

                {/* 구분선 */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-400 font-medium">또는 소셜 계정으로 로그인</span>
                    </div>
                </div>

                {/* 카카오 로그인 버튼 */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={kakaoLoginHandle}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[#FEE500] text-[#191919] font-bold shadow-md hover:bg-[#FADA00] transition-colors"
                >
                    {/* 카카오 로고 (SVG) */}
                    <svg
                        width="20"
                        height="19"
                        viewBox="0 0 20 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M10 0C4.477 0 0 3.518 0 7.858C0 10.665 1.83 13.13 4.58 14.532L3.415 18.814C3.35 19.053 3.627 19.24 3.844 19.102L8.85 15.903C9.228 15.938 9.611 15.956 10 15.956C15.523 15.956 20 12.438 20 8.098C20 3.758 15.523 0 10 0Z"
                            fill="#191919"
                        />
                    </svg>
                    카카오로 시작하기
                </motion.button>

                <div className="mt-8 flex flex-col space-y-4 text-center">
                    <Link
                        href="/auth/register"
                        className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                        아직 계정이 없으신가요? <span className="text-indigo-600 underline">회원가입</span>
                    </Link>
                    <button
                        type="button"
                        className="text-xs text-gray-400 hover:underline"
                    >
                        비밀번호를 잊으셨나요?
                    </button>
                </div>
            </motion.div>
        </div>
    );
}