"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACK_API } from "@/lib/constants";
import { useAlertStore } from '@/stores/useAlertStore';
import axios from "axios";


interface UserInfo {
    sns_id: number;            // 카카오 ID는 숫자형으로 옵니다
    sns_type: 'kakao' | 'naver' | 'google'; // 유니온 타입으로 고정하면 오타 방지 가능!
    nickname: string;
    profile_image?: string;    // 프로필 사진이 없을 수도 있으니 선택적 속성
    profile_thumbnail?: string;
}

export default function KakaoLoginPage() {

    const router = useRouter();
    const alert = useAlertStore();

    // 카카오 로그인

    const [nicknameVal, setNickname] = useState('');
    const [isLoadingVal, setIsLoading] = useState(false); // 가입 완료 버튼 클릭 시 로딩
    const [isErrMsgVal, setIsErrMsg] = useState(""); // 에러 메세지 설정 ()
    const [isInputStatusVal, setIsInputStatus] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    // ✅ 1. 함수를 컴포넌트 외부로 분리
    const loginWithKakao = async (code: any) => {
        try {
            const res = await axios.post(`${BACK_API}/auth/kakao`,
                { code },
                { withCredentials: true }
            )
            if (res.status == 200) {
                console.log('이제 이동!!');

                if (res.data.invalidFields.nickname || res.data.invalidFields.phone) {
                    // 닉네임 중복시 새로운 닉네임 받기
                    setIsInputStatus(true)
                    setUserInfo(res.data.userInfo)
                } else {
                    // 닉네임 중복 아닐시 (회원 가입 후 리턴) 메인으로 이동
                    window.location.href = "/";
                }
            }
        } catch (error) {
            console.error("네트워크 에러:", error);
            alert.open({
                type: "warning",
                title: "에러가 발생 했습니다.",
                description: (
                    <>
                        <p>에러가 발생 했습니다. 다시 시도해 주세요</p>
                    </>
                ),
                onConfirm: () => { },

            })
            router.push('/auth/login')
        }
    };

    useEffect(() => {
        // 클라이언트 환경에서만 URLSearchParams를 안전하게 사용
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
            loginWithKakao(code);
        } else {
            router.push('/auth/login')
        }
    }, []); // 의존성 배열을 비워두어 페이지 진입 시 딱 1번만 실행

    async function handleNicknameChk() {
        if (nicknameVal.length < 2) {
            setIsErrMsg("닉네임은 2글자 이상이어야 합니다.")
            return
        }

        try {
            const res = await axios.post(`${BACK_API}/auth/kakao_nickname_duplicate_chk`,
                { nickname: nicknameVal }
            )
            if (res.status == 200) {
                setIsErrMsg("")
            }
        } catch (err: any) {
            const m = err.response.data.message;
            setIsErrMsg(m)
        }
    }

    // 카카오 로그인 및 회원 가입 완료
    async function handleKakaoSubmit() {

        if (isErrMsgVal || !nicknameVal) {
            alert.open({
                type: "warning",
                title: "닉네임을 정확히 입력해 주세요",
                description: (
                    <>
                        <p>닉네임을 정확히 입력 후 다시 시도해 주세요</p>
                    </>
                ),
                onConfirm: () => {
                    router.push('/auth/login');
                },

            })
            return
        }

        if (!userInfo) {
            alert.open({
                type: "error",
                title: "에러가 발생 했습니다.",
                description: (
                    <>
                        <p>에러가 발생 했습니다. 다시 시도해 주세요</p>
                    </>
                ),
                onConfirm: () => {
                    router.push('/auth/login');
                },
            })
            return
        }



        try {
            userInfo.nickname = nicknameVal;
            const res = await axios.post(`${BACK_API}/auth/kakao_submit`,
                { userInfo },
                { withCredentials: true }
            )
        } catch (error) {

        }


    }




    return (
        <div className="">
            {isInputStatusVal ? (
                <div>
                    <div className="w-full max-w-130 mx-auto p-8 bg-white rounded-2xl shadow-xl">
                        {/* 상단 헤더 부분 */}
                        <div className="text-center mb-8">
                            <div className="inline-block p-3 bg-yellow-100 rounded-full mb-4">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">카카오 회원가입</h1>
                            <p className="text-gray-500 mt-2 text-sm">닉네임이 중복됩니다. 다른 닉네임을 입력해주세요</p>
                        </div>

                        {/* 입력 폼 */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                                    닉네임 (2~10자)
                                </label>
                                <input
                                    type="text"
                                    value={nicknameVal}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="멋진 닉네임을 입력하세요"
                                    className="base-input focus:ring-1 focus:ring-yellow-400 focus:border-transparent outline-none"
                                    onBlur={handleNicknameChk}
                                />
                                {/* 하단 안내 메시지 (상태에 따라 컬러 변경 가능) */}

                                {isErrMsgVal && (
                                    <p className="text-xs text-red-500 mt-2 ml-1">
                                        * {isErrMsgVal}
                                    </p>
                                )}

                            </div>

                            {/* 완료 버튼 */}
                            <button
                                onClick={handleKakaoSubmit}
                                disabled={nicknameVal.length < 2 || isLoadingVal}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95
              ${nicknameVal.length >= 2
                                        ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-yellow-100'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                {isLoadingVal ? '처리 중...' : '번개분양 시작하기'}
                            </button>
                        </div>

                        <div className="text-center">
                            {/* 뒤로가기 혹은 취소 (선택) */}
                            <button className="mt-6 text-gray-400 hover:text-gray-600 text-sm underline underline-offset-4">
                                로그인 취소하기
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center h-screen">
                    <p className="text-gray-500 animate-pulse font-bold text-xl md:text-2xl">
                        ⚡ 카카오 로그인 처리 중...
                    </p>
                </div>
            )}




        </div>

    )
}