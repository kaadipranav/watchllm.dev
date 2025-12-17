"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function LogoBeams() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-10 bg-transparent">
            {/* Main rotating container for the diagonal effect */}
            <div
                className="absolute inset-0 w-full h-full scale-[1.4] -rotate-[12deg]"
                style={{
                    transformOrigin: "center center",
                }}
            >
                {/* Beam 1: Primary Center Beam (Violet) */}
                <Beam
                    color="from-violet-600/20 via-violet-500/40 to-transparent"
                    delay={0}
                    duration={20}
                    width="w-32"
                    position="left-[45%]"
                    logoSize={60}
                    logoOpacity={0.4}
                />

                {/* Beam 2: Secondary Left (Teal) */}
                <Beam
                    color="from-teal-500/10 via-teal-400/20 to-transparent"
                    delay={5}
                    duration={25}
                    width="w-24"
                    position="left-[25%]"
                    logoSize={40}
                    logoOpacity={0.25}
                />

                {/* Beam 3: Secondary Right (Pink) */}
                <Beam
                    color="from-pink-500/10 via-pink-400/20 to-transparent"
                    delay={2}
                    duration={28}
                    width="w-28"
                    position="left-[65%]"
                    logoSize={50}
                    logoOpacity={0.3}
                />

                {/* Beam 4: Far Right (Blue) */}
                <Beam
                    color="from-blue-500/05 via-blue-400/10 to-transparent"
                    delay={-4}
                    duration={35}
                    width="w-20"
                    position="left-[85%]"
                    logoSize={30}
                    logoOpacity={0.15}
                />

                {/* Beam 5: Far Left (Violet/Dark) */}
                <Beam
                    color="from-violet-900/10 via-violet-800/20 to-transparent"
                    delay={-8}
                    duration={30}
                    width="w-20"
                    position="left-[5%]"
                    logoSize={30}
                    logoOpacity={0.15}
                />
            </div>

            {/* Vignette to fade edges */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)] opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-90" />
        </div>
    );
}

function Beam({
    color,
    delay,
    duration,
    width,
    position,
    logoSize,
    logoOpacity
}: {
    color: string;
    delay: number;
    duration: number;
    width: string;
    position: string;
    logoSize: number;
    logoOpacity: number;
}) {
    return (
        <div className={`absolute top-[-50%] bottom-[-50%] ${width} ${position} flex flex-col items-center`}>
            {/* The Glow/Color of the beam */}
            <div className={`absolute inset-0 bg-gradient-to-b ${color} blur-[30px]`} />

            {/* The Moving Logo Strip */}
            <motion.div
                className="w-full flex flex-col items-center gap-12 py-10"
                initial={{ y: 0 }}
                animate={{ y: "-50%" }}
                transition={{
                    duration: duration,
                    ease: "linear",
                    repeat: Infinity,
                    delay: delay,
                }}
            >
                {/* Repeat logos enough times to cover the scroll area */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="relative"
                        style={{
                            width: logoSize,
                            height: logoSize,
                            opacity: logoOpacity,
                            filter: `drop-shadow(0 0 10px rgba(168,85,247,0.5))` // Violet glow on the logo itself
                        }}
                    >
                        <Image
                            src="/watchllm_logo.png"
                            alt=""
                            width={logoSize}
                            height={logoSize}
                            className="w-full h-full object-contain brightness-150"
                        />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
