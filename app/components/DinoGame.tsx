'use client';

import { useEffect, useRef, useState } from 'react';

interface DinoGameProps {
    isFetching: boolean;
}

export default function DinoGame({ isFetching }: DinoGameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [playCount, setPlayCount] = useState(0);

    // Game constants
    const GRAVITY = 0.6;
    const JUMP_POWER = -10;
    const CACTUS_SPEED = 5;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let isJumping = false;

        const dino = {
            x: 50,
            y: 150,
            width: 20,
            height: 20,
            dy: 0,
        };

        const cacti: { x: number; y: number; width: number; height: number }[] = [];
        let frameCount = 0;
        let currentScore = 0;
        let isGameOver = false;

        const jump = () => {
            if (!isJumping && !isGameOver) {
                dino.dy = JUMP_POWER;
                isJumping = true;
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };

        const handleTouch = (e: TouchEvent) => {
            e.preventDefault();
            jump();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('touchstart', handleTouch, { passive: false });

        const drawDino = () => {
            ctx.fillStyle = '#18181b'; // zinc-900
            ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
        };

        const drawCactus = (x: number, y: number, w: number, h: number) => {
            ctx.fillStyle = '#10b981'; // emerald-500
            ctx.fillRect(x, y, w, h);
        };

        const checkCollision = (cactus: any) => {
            if (
                dino.x < cactus.x + cactus.width &&
                dino.x + dino.width > cactus.x &&
                dino.y < cactus.y + cactus.height &&
                dino.y + dino.height > cactus.y
            ) {
                isGameOver = true;
                setGameOver(true);
            }
        };

        const update = () => {
            if (isGameOver) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // ground
            ctx.beginPath();
            ctx.moveTo(0, 170);
            ctx.lineTo(600, 170);
            ctx.strokeStyle = '#e4e4e7'; // zinc-200
            ctx.stroke();

            // Dino physics
            dino.y += dino.dy;
            if (dino.y + dino.height < 170) {
                dino.dy += GRAVITY;
            } else {
                dino.y = 170 - dino.height;
                dino.dy = 0;
                isJumping = false;
            }
            drawDino();

            // Cacti Logic
            if (frameCount % 90 === 0) {
                cacti.push({
                    x: canvas.width,
                    y: 150,
                    width: 15,
                    height: 20,
                });
            }

            for (let i = 0; i < cacti.length; i++) {
                cacti[i].x -= CACTUS_SPEED;
                drawCactus(cacti[i].x, cacti[i].y, cacti[i].width, cacti[i].height);
                checkCollision(cacti[i]);
            }

            // Remove off-screen cacti
            while (cacti.length > 0 && cacti[0].x < -20) {
                cacti.shift();
                currentScore++;
                setScore(currentScore);
            }

            frameCount++;
            animationFrameId = requestAnimationFrame(update);
        };

        update();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('touchstart', handleTouch);
            cancelAnimationFrame(animationFrameId);
        };
    }, [playCount]);

    return (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-zinc-50/95 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
            <div className="flex flex-col items-center gap-6 p-8 bg-white border border-zinc-200 rounded-3xl shadow-xl max-w-lg w-full">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black tracking-tighter text-zinc-900">Syncing Data...</h2>
                    <p className="text-zinc-500 font-medium text-sm">Waiting for Google Apps Script to respond (avg 5-15s)</p>
                </div>

                <div className="relative w-full overflow-hidden border border-zinc-200 rounded-xl bg-zinc-50 flex justify-center py-4">
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="max-w-full h-auto"
                    />
                    {gameOver && isFetching && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px]">
                            <p className="text-zinc-900 font-black text-xl mb-2">Game Over!</p>
                            <p className="text-zinc-500 text-sm mb-4">Score: {score}</p>
                            <button
                                onClick={() => {
                                    setGameOver(false);
                                    setScore(0);
                                    setPlayCount(c => c + 1);
                                }}
                                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-zinc-800 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-between w-full items-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Score: {score}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        Press <span className="px-2 py-1 bg-zinc-200 rounded text-zinc-600">SPACE</span> to jump
                    </p>
                </div>
            </div>
        </div>
    );
}
