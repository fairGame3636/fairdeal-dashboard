import React, { FC } from 'react';

// --- Helper Data ---
const redNumbers: number[] = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// --- Type Definitions ---
interface RoundData {
    winningNumber: number | null;
    betDetails: { [key: string]: number };
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: RoundData | null;
    isLoading: boolean;
}

// --- Reusable Bet Chip Component ---
const BetChip: FC<{ amount: number; isWin: boolean }> = ({ amount, isWin }) => {
    const formatAmount = (num: number) => {
        const roundedNum = Math.round(num); // Round the number first!
        if (roundedNum >= 1000) {
            const formatted = (roundedNum / 1000).toFixed(1);
            return formatted.endsWith('.0') ? `${Math.floor(roundedNum / 1000)}K` : `${formatted}K`;
        }
        return roundedNum.toString();
    };

    if (isWin) {
        return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-blue-600 text-white text-sm font-bold rounded-full border-2 border-yellow-300 shadow-lg z-10 animate-pulse">
                Win
            </div>
        );
    }

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-cyan-400 text-black text-xs font-bold rounded-full border-2 border-white shadow-lg z-10">
            {formatAmount(amount)}
        </div>
    );
};

// --- Main Modal Component ---
const RoundViewerModal: FC<ModalProps> = ({ isOpen, onClose, data, isLoading }) => {
    if (!isOpen) return null;

    // --- THIS IS WHERE THE FIX IS APPLIED ---
    const NumberBox: FC<{ number: number }> = ({ number }) => {
        const isRed = redNumbers.includes(number);
        const isBlack = number !== 0 && !isRed;
        const isGreen = number === 0;

        const bgColor = isRed ? 'bg-red-600' : isBlack ? 'bg-black' : 'bg-green-600';
        
        // --- FIX: Use optional chaining here ---
        const betAmount = data?.betDetails?.[String(number)];
        const isWinningNumber = data?.winningNumber === number;

        return (
            <div className={`relative flex items-center justify-center h-16 bg-white font-bold text-2xl border-r border-b border-gray-400 ${bgColor} text-white`}>
                {number}
                {/* This line is now safe because betAmount will be undefined instead of crashing */}
                {betAmount && <BetChip amount={betAmount} isWin={isWinningNumber} />}
            </div>
        );
    };
    
    const BetBox: FC<{ label: string | React.ReactNode; className?: string }> = ({ label, className }) => (
        <div className={`flex items-center justify-center h-16 text-lg font-bold bg-gray-200 border-r border-b border-gray-400 ${className}`}>
          {label}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-5">
                    <h2 className="text-2xl font-bold text-gray-800">Round Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-4xl leading-none">&times;</button>
                </div>
                {isLoading ? (
                    <div className="text-center py-24 text-gray-600 font-semibold">Loading Round Details...</div>
                ) : data ? (
                     <div className="border-l border-t border-gray-400">
                        <div className="grid grid-cols-[1fr,13fr]">
                             <div className="row-span-3 bg-white relative flex items-center justify-center border-r border-b border-gray-400">
                                 <div className="h-full w-full bg-green-600 text-white font-bold text-2xl flex items-center justify-center">0</div>
                                 {/* This was the previous fix, which is still correct */}
                                 {data?.betDetails?.['0'] && <BetChip amount={data.betDetails['0']} isWin={data.winningNumber === 0} />}
                             </div>
                             <div className="grid grid-cols-13">
                                 {[...Array(12)].map((_, i) => <NumberBox key={i} number={3 + i * 3} />)}
                                 <BetBox label="2:1" />
                                 {[...Array(12)].map((_, i) => <NumberBox key={i} number={2 + i * 3} />)}
                                 <BetBox label="2:1" />
                                 {[...Array(12)].map((_, i) => <NumberBox key={i} number={1 + i * 3} />)}
                                 <BetBox label="2:1" />
                             </div>
                         </div>
                     </div>
                ) : (
                    <div className="text-center py-24 text-red-600 font-semibold">Could not load round details. Please try again.</div>
                )}
            </div>
        </div>
    );
};

export default RoundViewerModal;