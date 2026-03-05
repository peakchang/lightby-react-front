"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { validateId, formatPhoneNumber, getPureNumbers, formatTime } from "@/lib/lib"
import { useAlertStore } from '@/stores/useAlertStore';
import { BACK_API } from '@/lib/constants';

export default function RegisterPage() {
    const router = useRouter();
    const alert = useAlertStore();

    /*
    alert 모달 뜨는 경우
    >> 인증번호 발송시 아이디 또는 비밀번호 비어있을시 ok
    >> 인증번호 발송 완료시 ok
    >> 인증번호 횟수 초과시 ok
    >> 인증번호 시간 초과시 ok
    >> 회원가입 완료시
    >> 각 입력 창 비어있을시 ok
    */

    // input
    const [userIdVal, setUserId] = useState('');
    const [nameVal, setName] = useState('');
    const [nicknameVal, setNickname] = useState('');
    const [phoneVal, setPhone] = useState('');
    const [authNumVal, setAuthNum] = useState('');
    const [passwordVal, setPassword] = useState('');
    const [passwordCheckVal, setPasswordCheck] = useState('');

    // input창 bind
    const userIdRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const nicknameRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);


    // 에러 메세지 모음 (각 영역 하단에 배치)
    const [userIdErrVal, setUserIdErr] = useState<string | null>(null);
    const [nicknameErrVal, setNicknameErr] = useState<string | null>(null);
    const [phoneErrVal, setPhoneErr] = useState<string | null>(null);
    const [authErrVal, setauthErr] = useState<string | null>(null);
    const [passwordErrVal, setPasswordErr] = useState<string | null>(null);

    // 각 상태값
    const [isAuthVal, setIsAuth] = useState(false); // 인증 완료 여부
    const [isAuthNumSentVal, setIsAuthNumSent] = useState(false); // 인증번호 발송 
    const [timeLeftVal, setTimeLeft] = useState("03:00"); // 인증번호 입력 시간, 3분(180초) 기준
    const timerRef = useRef<NodeJS.Timeout | null>(null); // 인터벌 함수 저장용


    useEffect(() => {
        return () => {
            // 컴포넌트 언마운트 될때 메모리 누수 방지 (페이지 벗어날시 인터벌 함수 삭제)
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);


    // 인증 요청 타이머 시작 함수 (180초 내 입력, 미입력시 액션)
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
                    onConfirm: () => userIdRef.current?.focus(),
                })
                return;
            } else {
                leftTime = leftTime - 1;
                setTimeLeft(formatTime(leftTime)); // 시간은 숫자 > 남은 초(string)로 변경
            }
        }, 1000);
    };

    // 중복 및 에러 체크 함수 (아이디 / 닉네임 / 비밀번호 확인)
    const handleChkVal = async (e: React.FocusEvent<HTMLInputElement>) => {
        const type = e.target.dataset.value; // 타입 (DB의 행 값) 받아오기 (dataset)
        if (type == "user_id") {
            // 아이디 형식 체크 (통과시 에러메세지 null (없애기))
            const idChkBool = validateId(userIdVal)
            if (!idChkBool) { setUserIdErr("아이디 형식이 올바르지 않습니다."); return; }
            try {
                await axios.post(`${BACK_API}/auth/duplicate_chk`, {
                    type,
                    value: userIdVal
                })
            } catch (error) {
                setUserIdErr('이미 존재하는 아이디입니다')
                return
            }
            // 정상이면 초기화
            setUserIdErr(null)
        } else if (type == 'nickname') {
            try {
                await axios.post(`${BACK_API}/auth/duplicate_chk`, {
                    type,
                    value: nicknameVal
                })
            } catch (error) {
                setNicknameErr('이미 존재하는 닉네임입니다')
                return
            }
            // 정상이면 초기화
            setNicknameErr(null)
        } else if (type == 'password') {
            if (passwordVal !== passwordCheckVal) {
                setPasswordErr('비밀번호가 일치하지 않습니다.')
                return
            } else {
                setPasswordErr(null)
            }
        }
    }
    // 휴대폰 중복 및 인증 체크 함수
    async function handleAuthSendVal() {

        // 필수값 공란 체크 (서버에서 인증시 아이디 / 휴대폰 번호 필요)
        if (!userIdVal) {
            alert.open({
                type: "warning",
                title: "아이디를 입력하세요.",
                description: "아이디 란이 비어 있습니다. 아이디를 입력해 주세요.",
                onConfirm: () => userIdRef.current?.focus(),
            })
            return
        }
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
            await axios.post(`${BACK_API}/auth/duplicate_chk`, { type: phone, value: phone })
            setPhoneErr(null)
        } catch (error) {
            setPhoneErr('이미 존재하는 전화번호입니다.')
            return
        }

        // 에러 없으면 인증번호 발송!!
        try {
            const res = await axios.post(`${BACK_API}/auth/send_verify`, { phone, user_id: userIdVal })
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

    // 휴대폰 인증 체크 함수
    async function handleAuthChk() {
        if (!authNumVal) {
            setauthErr('인증번호를 입력해 주세요.')
            return
        }
        try {
            const res = await axios.post(`${BACK_API}/auth/verify_code_chk`,
                {
                    user_id: userIdVal, verificationCode: authNumVal
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

    // 최종 회원가입
    async function handleSubmit(e: any) {
        e.preventDefault()


        validateFields(); // input 값 공란일 경우 alert (하단 함수 확인)


        // 비밀번호 체크는 입력이 아예 안되는 경우도 있으니 추가 체크 한번만 더!
        if (passwordVal !== passwordCheckVal) {
            setPasswordErr('비밀번호가 일치하지 않습니다.')
            return
        } else {
            setPasswordErr(null)
        }

        // 각 에러 체크 (발생한 에러가 처리 안되었을 경우 alert)
        const errChkArr = [userIdErrVal, nicknameErrVal, phoneErrVal, passwordErrVal]
        for (let i = 0; i < errChkArr.length; i++) {
            const val = errChkArr[i];
            if (val) {
                alert.open({
                    type: "warning",
                    title: "에러가 발생 했습니다.",
                    description: (
                        <>
                            <p>{val}</p>
                            <p>확인 후 다시 시도해주세요.</p>
                        </>
                    ),
                    onConfirm: () => { },
                });
                return
            }
        }

        if (!isAuthVal) {
            alert.open({
                type: "warning",
                title: `휴대폰 인증을 완료 해 주세요`,
                description: (
                    <>
                        <p>휴대폰 인증이 완료되지 않았습니다.</p>
                        <p>휴대폰 인증을 완료 해 주세요</p>
                    </>
                ),
                onConfirm: () => { },
            });
            return
        }

        try {
            const res = await axios.post(`${BACK_API}/auth/register`, {
                user_id: userIdVal,
                name: nameVal,
                nickname: nicknameVal,
                phone: getPureNumbers(phoneVal),
                password: passwordVal
            })

            if (res.status == 200) {
                const timer = setTimeout(() => {
                    if (typeof alert.close === "function") { alert.close(); } // 1. 모달을 닫는다
                    router.push('/auth/login');
                }, 2500)

                alert.open({
                    type: "success",
                    title: `회원 가입 완료`,
                    description: (
                        <>
                            <p>번개분양 회원 가입이 완료 되었습니다.</p>
                            <p>확인 버튼 클릭 후 로그인을 진행 해 주세요</p>
                            <p>(3초 뒤 자동으로 이동 합니다.)</p>
                        </>
                    ),
                    onConfirm: () => {
                        clearTimeout(timer);
                        router.push('/auth/login');
                    },
                });

            }
        } catch (error) {

        }
    }

    // 각 항목이 비어있을 경우 체크
    const validateFields = () => {
        // 1. 검증할 필드들의 설정 (순서대로 검사됨)
        const fields = [
            { val: userIdVal, ref: userIdRef, label: "아이디" },
            { val: nameVal, ref: nameRef, label: "이름" },
            { val: nicknameVal, ref: nicknameRef, label: "닉네임" },
            { val: phoneVal, ref: phoneRef, label: "전화번호" },
            { val: passwordVal, ref: passwordRef, label: "비밀번호" },
        ];

        // 2. 루프를 돌며 검증
        for (const field of fields) {
            if (!field.val || field.val.trim() === "") {
                alert.open({
                    type: "warning",
                    title: `${field.label}란을 입력하세요.`,
                    description: `${field.label}란이 비어 있습니다. ${field.label}를 입력해 주세요.`,
                    onConfirm: () => field.ref.current?.focus(),
                });
                return false; // 하나라도 걸리면 중단
            }
        }

        return true; // 모두 통과
    };


    return (
        <div className="w-full max-w-130 mx-auto py-8 px-2 flex flex-col justify-center">
            <div className="mb-10 text-center">

                <Link href="/">
                    <div className='mb-4'>
                        <Image className='mx-auto' src="/logo.png" width={192} height={100} alt='번개분양 로고'></Image>
                    </div>
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 font-nanum-square">
                    회원가입
                </h1>
                <p className="text-gray-500 mt-2">
                    번개분양의 새로운 가족이 되어주세요!
                </p>
            </div>

            <form className="" onSubmit={handleSubmit}>
                {/* 2단 그리드 레이아웃 (데스크톱 기준) */}
                <div className="grid grid-cols-1 gap-1">

                    {/* 아이디 */}
                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-semibold text-gray-700 pl-1">
                            아이디
                        </label>
                        <input
                            type="text"
                            placeholder="아이디 입력"
                            ref={userIdRef}
                            className="base-input"
                            value={userIdVal}
                            data-value='user_id'
                            onChange={(e) => setUserId(e.target.value)}
                            onBlur={handleChkVal}
                        />

                        {userIdErrVal && (
                            <div className="text-xs text-red-500 pl-2">
                                {userIdErrVal}
                            </div>
                        )}
                    </div>



                    {/* 이름 */}
                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-semibold text-gray-700 pl-1">
                            이름
                        </label>
                        <input
                            type="text"
                            placeholder="실명 입력"
                            ref={nameRef}
                            className="base-input"
                            value={nameVal}
                            onChange={(e) => setName(e.target.value)} />
                    </div>

                    {/* 닉네임 */}
                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-semibold text-gray-700 pl-1">
                            닉네임
                        </label>
                        <input
                            type="text"
                            placeholder="활동명 입력"
                            ref={nicknameRef}
                            className="base-input"
                            value={nicknameVal}
                            onChange={(e) => setNickname(e.target.value)}
                            data-value='nickname'
                            onBlur={handleChkVal}
                        />

                        {nicknameErrVal && ( // 닉네임 에러 문구
                            <div className="text-xs text-red-500 pl-2">
                                {nicknameErrVal}
                            </div>
                        )}
                    </div>

                    {/* 휴대폰 번호 입력창 */}
                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-semibold text-gray-700 pl-1">
                            휴대폰 번호
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                ref={phoneRef}
                                className="flex-1 base-input"
                                placeholder="010-0000-0000"
                                disabled={isAuthVal}
                                value={phoneVal}
                                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} />
                            <button
                                type="button"
                                onClick={handleAuthSendVal}
                                disabled={isAuthVal}
                                className={`btn-base px-5 text-sm ${isAuthVal ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-700"}`}
                            >

                                {isAuthVal ? "인증완료" : isAuthNumSentVal ? "재전송" : "인증요청"}

                            </button>

                        </div>

                        {phoneErrVal && (
                            <div className='text-xs text-red-500 pl-2'>
                                {phoneErrVal}
                            </div>
                        )}

                    </div>

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

                    {/* 비밀번호 */}
                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-semibold text-gray-700 pl-1">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            placeholder="8자리 이상 입력"
                            ref={passwordRef}
                            value={passwordVal}
                            onChange={(e) => setPassword(e.target.value)}
                            className="base-input"
                        />
                    </div>

                    {/* 비밀번호 확인 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700 pl-1">
                            비밀번호 확인
                        </label>
                        <input
                            type="password"
                            placeholder="비밀번호 재입력"
                            className="base-input"
                            value={passwordCheckVal}
                            onChange={(e) => setPasswordCheck(e.target.value)}
                            data-value="password"
                            onBlur={handleChkVal}
                        />
                        {passwordErrVal && (
                            <div className='text-xs text-red-500 pl-2'>
                                {passwordErrVal}
                            </div>
                        )}

                    </div>
                </div>

                {/* 가입하기 버튼 */}
                <button type="submit" className="btn-base w-full bg-blue-500 hover:bg-blue-600 mt-10">
                    가입하기
                </button>
            </form>

            {/* 로그인 이동 링크 */}
            <div className="flex justify-center mt-6">
                <span className="text-gray-500 text-sm">이미 아이디가 있으신가요?</span>
                <Link href="/auth/login" className="text-blue-500 text-sm ml-2 font-semibold hover:underline">
                    로그인하기
                </Link>
            </div>
        </div>
    );
}