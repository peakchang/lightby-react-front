import PageTransition from "@/components/PageTransition";

export default function Page1() {
    return (
        <PageTransition direction="down">
            <div className="bg-blue-500 flex items-center justify-center h-full text-white text-4xl">
                Page 1: Left to Right Slide
            </div>
        </PageTransition>
    );
}