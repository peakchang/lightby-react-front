"use client";

import { motion } from "framer-motion";

type Direction = "left" | "right" | "up" | "down";

const variants = {
    initial: (direction: Direction) => ({
        x: direction === "left" ? "100%" : direction === "right" ? "-100%" : 0,
        y: direction === "up" ? "100%" : direction === "down" ? "-100%" : 0,
        opacity: 0,
    }),
    animate: { x: 0, y: 0, opacity: 1 },
    exit: (direction: Direction) => ({
        x: direction === "left" ? "-100%" : direction === "right" ? "100%" : 0,
        y: direction === "up" ? "-100%" : direction === "down" ? "100%" : 0,
        opacity: 0,
    }),
};

export default function PageTransition({
    children,
    direction = "left",
}: {
    children: React.ReactNode;
    direction?: Direction;
}) {
    return (
        <motion.div
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full h-screen"
        >
            {children}
        </motion.div>
    );
}