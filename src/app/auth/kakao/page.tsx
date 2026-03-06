"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BACK_API } from "@/lib/constants";
import { useAlertStore } from '@/stores/useAlertStore';
import axios from "axios";
import { validateId, formatPhoneNumber, getPureNumbers, formatTime } from "@/lib/lib";
import { motion, AnimatePresence } from 'framer-motion';

interface UserInfo {
    sns_id: string;
    sns_type: 'kakao' | 'naver' | 'google';
    nickname: string;
    profile_image?: string;
    profile_thumbnail?: string;
}

export default function KakaoLoginPage() {
    const router = useRouter();
    const alert = useAlertStore();

    const phoneRef = useRef<HTMLInputElement>(null); // 휴대폰 input 영역

    // return 데이터
    const [isInputStatusVal, setIsInputStatus] = useState(false); // 문제 있을시 입력 창 여는 변수
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null); // 문제 있을시 추가 회원가입 > 로그인을 위해 임시로 데이터 저장
    const [nickChkVal, setNickChk] = useState({ msg: "", status: false }); // 닉네임 영역 보이게 하는 변수
    const [phoneChkVal, setPhoneChk] = useState({ msg: "", status: false }); // 휴대폰 영역 보이게 하는 변수

    // input value
    const [nicknameVal, setNickname] = useState('');
    const [phoneVal, setPhone] = useState('');
    const [authNumVal, setAuthNum] = useState(''); // 입력된 인증번호

    // input 하단 에러 표기
    const [isNickErrMsgVal, setIsErrMsg] = useState("");
    const [phoneErrVal, setPhoneErr] = useState<string | null>(null);
    const [authErrVal, setauthErr] = useState<string | null>(null);

    // etc
    const [isAuthVal, setIsAuth] = useState(false); // 인증 완료 상태 체크 변수
    const [isLoadingVal, setIsLoading] = useState(false); // submit 요청 후 로딩중 나타내는 변수
    const [isAuthNumSentVal, setIsAuthNumSent] = useState(false); // 인증번호 발송 상태 변수
    const [timeLeftVal, setTimeLeft] = useState("03:00"); // 인증번호 입력 시간, 3분(180초) 기준
    const timerRef = useRef<NodeJS.Timeout | null>(null); // 인터벌 함수 저장용

    const loginWithKakao = async (code: string) => {
        try {
            const res = await axios.post(`${BACK_API}/auth/kakao`,
                { code },
                { withCredentials: true }
            );

            if (res.status === 200) {
                const { isNickInvalid, isPhoneInvalid, userInfo: dataUserInfo } = res.data;

                // 데이터 중복 또는 누락 시 입력창 모드 활성화
                if (isNickInvalid !== "ok" || isPhoneInvalid !== "ok") {
                    setIsInputStatus(true);
                    setUserInfo(dataUserInfo);

                    // 닉네임 상태 설정
                    if (isNickInvalid === "invalid") {
                        setNickChk({ msg: "닉네임 데이터 누락", status: true });
                    } else if (isNickInvalid === "duplicate") {
                        setNickChk({ msg: "닉네임 중복", status: true });
                    }

                    // 전화번호 상태 설정 (닉네임 에러 여부에 따라 메시지 조합)
                    let phoneMsg = "";
                    if (isPhoneInvalid === "invalid") {
                        phoneMsg = isNickInvalid !== "ok" ? ", 전화번호 데이터 누락" : "전화번호 데이터 누락";
                    } else if (isPhoneInvalid === "duplicate") {
                        phoneMsg = isNickInvalid !== "ok" ? ", 전화번호 중복" : "전화번호 중복";
                    }

                    if (phoneMsg) {
                        setPhoneChk({ msg: phoneMsg, status: true });
                    }
                } else {
                    // 모두 정상이면 메인으로
                    window.location.href = "/";
                }
            }
        } catch (error) {
            console.error("네트워크 에러:", error);
            alert.open({
                type: "warning",
                title: "에러가 발생 했습니다.",
                description: <p>에러가 발생 했습니다. 다시 시도해 주세요</p>,
                onConfirm: () => { router.push('/auth/login'); },
            });
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
            loginWithKakao(code);
        } else {
            router.push('/auth/login');
        }
    }, []);

    async function handleNicknameChk() {
        if (nicknameVal.length < 2) {
            setIsErrMsg("닉네임은 2글자 이상이어야 합니다.");
            return;
        }
        try {
            const res = await axios.post(`${BACK_API}/auth/kakao_nickname_duplicate_chk`, { nickname: nicknameVal });
            if (res.status === 200) setIsErrMsg("");
        } catch (err: any) {
            setIsErrMsg(err.response?.data?.message || "중복 체크 에러");
        }
    }

    // 인증 발송 후 타이머
    const startTimer = () => {
        // 기존에 돌아가던 타이머가 있다면 초기화 (재발송 대비)
        if (timerRef.current) clearInterval(timerRef.current);

        setTimeLeft("03:00"); // 함수 시작시 기본값 3분 설정
        let leftTime = 180; // "" 기본값 3분 (60 * 3) 설정
        timerRef.current = setInterval(() => {
            if (leftTime <= 1) {
                if (timerRef.current) clearInterval(timerRef.current); // timerRef 에 저장된 interval 함수 삭제
                setTimeLeft("00:00"); // timeLeftVal 초기화
                // ----- 아래 4개 인증번호 입력 부분 닫힐때 세트로 움직이기
                setIsAuthNumSent(false); // 인증번호 입력 area 닫아버리기
                setauthErr("") // 인증 부분 에러 메세지도 초기화
                setAuthNum("") // 인증 input value 도 초기화
                setIsAuth(false) // 인증 성공 상태 false로
                alert.open({
                    type: "warning",
                    title: "인증 시간이 만료 되었습니다.",
                    description: (
                        <>
                            <p>입력할수 있는 인증 시간이 만료 되었습니다.</p>
                            <p>잠시 후 다시 시도해 주세요</p>
                        </>
                    ),
                    onConfirm: () => { },
                })
                return;
            } else {
                leftTime = leftTime - 1;
                setTimeLeft(formatTime(leftTime)); // 시간은 숫자 > 남은 초(string)로 변경
            }
        }, 1000);
    };

    // 휴대폰 중복 및 인증 체크 함수
    async function handleAuthSendVal() {
        if (!phoneVal) {
            alert.open({
                type: "warning",
                title: "전화번호를 입력하세요.",
                description: "전화번호 란이 비어 있습니다. 전화번호를 입력해 주세요.",
                onConfirm: () => phoneRef.current?.focus(),
            })
            return
        }

        const phone = getPureNumbers(phoneVal);

        // 전화번호 중복 체크
        try {
            await axios.post(`${BACK_API}/auth/duplicate_chk`, { type: 'phone', value: phone })
            setPhoneErr(null)
        } catch (error) {
            setPhoneErr('이미 존재하는 전화번호입니다.')
            return
        }

        // 에러 없으면 인증번호 발송!!
        try {
            const res = await axios.post(`${BACK_API}/auth/send_verify`, { phone, user_id: userInfo?.sns_id })
            console.log(res.data.code);

            if (res.status == 200) {
                alert.open({
                    type: "info",
                    title: "인증번호가 발송 되었습니다.",
                    description: (
                        <>
                            <p>입력하신 번호로 인증번호가 발송 되었습니다.</p>
                            <p>3분 내에 인증 확인을 진행해 주세요.</p>
                        </>
                    ),
                    onConfirm: () => { }
                })
                startTimer();
                setIsAuthNumSent(true)
            }
        } catch (err: any) {

        }
    }

    async function handleAuthChk() {
        if (!authNumVal) {
            setauthErr('인증번호를 입력해 주세요.')
            return
        }
        try {
            const res = await axios.post(`${BACK_API}/auth/verify_code_chk`,
                {
                    user_id: userInfo?.sns_id, verificationCode: authNumVal
                }
            )
            // 인증 성공시
            if (res.status == 200) {
                setIsAuth(true)
                setIsAuthNumSent(false); // 인증번호 입력 area 닫아버리기
                setauthErr("") // 인증 부분 에러 메세지도 초기화
                setAuthNum("") // 인증 input value 도 초기화
                if (timerRef.current) clearInterval(timerRef.current); // timerRef 에 저장된 interval 함수 삭제
            }
        } catch (err: any) {
            // 인증 실패시 상태 값에 따라 처리
            if (err.response) {
                const m = err.response.data.message;
                if (err.response.status == 400) {
                    setauthErr(m)
                } else {
                    alert.open({
                        type: "warning",
                        title: m,
                        description: m,
                        onConfirm: () => { }
                    })
                    // ----- 아래 4개 닫힐때 세트로 움직이기
                    setIsAuthNumSent(false); // 인증번호 입력 area 닫아버리기
                    setauthErr("") // 인증 부분 에러 메세지도 초기화
                    setAuthNum("") // 인증 input value 도 초기화
                    setIsAuth(false)
                }
            }
        }
    }

    async function handleKakaoSubmit() {
        if (isNickErrMsgVal || !nicknameVal) {
            alert.open({
                type: "warning",
                title: "닉네임을 정확히 입력해 주세요",
                description: <p>닉네임을 정확히 입력 후 다시 시도해 주세요</p>,
            });
            return;
        }

        if (!userInfo) return;

        try {
            setIsLoading(true);
            const res = await axios.post(`${BACK_API}/auth/kakao_submit`,
                { userInfo: { ...userInfo, nickname: nicknameVal, phone: phoneVal } },
                { withCredentials: true }
            );
            if (res.status === 200) window.location.href = "/";
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }



    return (
        <div className="min-h-screen bg-gray-50 flex justify-center pt-10">
            {isInputStatusVal ? (
                <div className="w-full max-w-130 mx-auto p-8 bg-white rounded-2xl shadow-xl">
                    <div className="text-center mb-8">
                        <div className="inline-block p-3 bg-yellow-100 rounded-full mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">카카오 회원가입</h1>
                        <p className="text-red-500 mt-2 text-sm font-medium">
                            {nickChkVal.status && nickChkVal.msg}
                            {phoneChkVal.status && phoneChkVal.msg}
                        </p>
                        <p className="text-gray-500 mt-1 text-sm">정보를 수정하여 가입을 완료해주세요.</p>
                    </div>

                    <div className="space-y-6">
                        {/* 닉네임 입력 */}
                        {nickChkVal.status && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                                    닉네임 (2~10자)
                                </label>
                                <input
                                    type="text"
                                    value={nicknameVal}
                                    onChange={(e) => setNickname(e.target.value)}
                                    onBlur={handleNicknameChk}
                                    placeholder="닉네임을 입력하세요"
                                    className="base-input"
                                />

                                {isNickErrMsgVal && (
                                    <p className="text-xs text-red-500 mt-2 ml-1">* {isNickErrMsgVal}</p>
                                )}
                            </div>
                        )}


                        {/* 휴대폰 번호 입력 */}

                        {phoneChkVal.status && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700 ml-1">휴대폰 번호</label>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        ref={phoneRef}
                                        className="flex-1 base-input"
                                        placeholder="010-0000-0000"
                                        disabled={isAuthVal}
                                        value={phoneVal}
                                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAuthSendVal}
                                        disabled={isAuthVal}
                                        className={`px-4 rounded-xl text-sm font-bold text-white transition-colors ${isAuthVal ? "bg-gray-400" : "bg-indigo-500 hover:bg-indigo-600"
                                            }`}
                                    >
                                        {isAuthVal ? "인증완료" : isAuthNumSentVal ? "재전송" : "인증요청"}
                                    </button>
                                </div>
                                {phoneErrVal && (
                                    <p className="text-xs text-red-500 mt-2 ml-1">* {phoneErrVal}</p>
                                )}
                            </div>


                        )}

                        {/* 2. Framer Motion 애니메이션 영역 */}
                        <AnimatePresence>
                            {isAuthNumSentVal && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: -20 }} // 시작 상태
                                    animate={{ opacity: 1, height: 'auto', marginTop: 0 }} // 나타난 상태
                                    exit={{ opacity: 0, height: 0, marginTop: -20 }}    // 사라질 때 상태
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-col gap-2 pb-2 mb-4">
                                        <label className="text-sm font-semibold text-indigo-600 pl-1">인증번호</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 base-input border-indigo-200"
                                                value={authNumVal}
                                                onChange={(e) => setAuthNum(e.target.value)}
                                                placeholder="6자리 숫자"
                                            />
                                            <button type="button" className="btn-base bg-indigo-600 hover:bg-indigo-700 px-5 text-sm" onClick={handleAuthChk}>
                                                확인
                                            </button>
                                        </div>

                                        <div className='flex justify-between  text-red-500 px-2'>
                                            <div className='text-xs'>
                                                {authErrVal && (
                                                    <span>
                                                        {authErrVal}
                                                    </span>
                                                )}
                                            </div>
                                            <div className='text-sm'>
                                                남은시간 : {timeLeftVal}
                                            </div>
                                        </div>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>




                        {/* 완료 버튼 */}
                        <button
                            onClick={handleKakaoSubmit}
                            disabled={nicknameVal.length < 2 || isLoadingVal}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 ${nicknameVal.length >= 2
                                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isLoadingVal ? '처리 중...' : '번개분양 시작하기'}
                        </button>

                        <div className="text-center">
                            <button
                                onClick={() => router.push('/auth/login')}
                                className="text-gray-400 hover:text-gray-600 text-sm underline underline-offset-4"
                            >
                                로그인 취소하기
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col justify-center items-center h-screen">
                    <p className="text-gray-500 animate-pulse font-bold text-xl md:text-2xl">
                        ⚡ 카카오 로그인 처리 중...
                    </p>
                </div>
            )}
        </div>
    );
}