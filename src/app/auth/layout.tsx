// app/auth/layout.tsx
import React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <section className=" bg-gray-50 p-2 ">
            {/* 최대 너비 1020px 제한 및 중앙 정렬 컨테이너 */}
            <div className="w-full max-w-255 mx-auto bg-white rounded-2xl  flex flex-col shadow-sm border border-gray-100 overflow-hidden min-h-screen">
                {children}
            </div>
        </section>
    );
}