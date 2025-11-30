import { FC, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { BetDetail, NumberBoxProps, BetBoxProps, RacetrackNumberBoxProps, RoundData } from '../../modals/Game';

const SOCKET_SERVER_URL = "http://3.111.169.159:3000";
// const SOCKET_SERVER_URL = "http://localhost:5000";
let socket: Socket | null = null;

const redNumbers: number[] = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// --- Racetrack Mappings ---
const wheelOrder: number[] = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

// --- ⭐️⭐️⭐️ FIX 1: VOISINS LIST UPDATED ⭐️⭐️⭐️ ---
// Yeh ab aapki 10-number list use karega
const VOISINS_NUMBERS: number[] = [22, 18, 29, 7, 28, 25, 2, 21, 4, 19]; 
// --- ⭐️⭐️⭐️ END FIX 1 ⭐️⭐️⭐️ ---

const TIERS_NUMBERS: number[] = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
const ORPHELINS_NUMBERS: number[] = [1, 20, 14, 31, 9, 17, 34, 6];
const ZERO_SPIEL_NUMBERS: number[] = [12, 35, 3, 26, 0, 32, 15];

// --- ⭐️⭐️⭐️ FIX 2: NEW CONSTANTS FOR RED/BLACK SPLITS ⭐️⭐️⭐️ ---
const RED_SPLITS_SELECTIONS: string[] = ['9/12', '16/19', '18/21', '27/30'];
const BLACK_SPLITS_SELECTIONS: string[] = ['8/11', '10/11', '10/13', '17/20', '26/29', '28/29', '28/31'];
// --- ⭐️⭐️⭐️ END FIX 2 ⭐️⭐️⭐️ ---


// --- Helper maps (No Change) ---
const DOZEN_MAP: { [key: string]: number[] } = {
    'D1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    'D2': [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    'D3': [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
};
const COLUMN_MAP: { [key: string]: number[] } = {
    'C1': [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
    'C2': [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    'C3': [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]
};
const PARITY_MAP: { [key: string]: number[] } = {
    'EVEN': [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    'ODD': [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35]
};
const RANGE_MAP: { [key: string]: number[] } = {
    'LOW': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    'HIGH': [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
};
const COLOR_MAP: { [key: string]: number[] } = {
    'RED': redNumbers,
    'BLACK': [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]
};


// --- Global Helper Function: formatAmount (No Change) ---
const formatAmount = (num: number) => {
    const roundedNum = Math.round(num);
    if (roundedNum >= 1000) {
        const formatted = (roundedNum / 1000).toFixed(1);
        return formatted.endsWith('.0') ? `${Math.floor(roundedNum / 1000)}K` : `${formatted}K`;
    }
    return roundedNum.toString();
};

// --- *** NEW HELPER: formatPoints (FOR BUG 4) *** ---
const formatPoints = (points: number | undefined) => {
    const num = points || 0;
    return num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// --- Component: BetChip (No Change) ---
const BetChip: FC<{ amount: number; onRacetrack?: boolean }> = ({ amount, onRacetrack = false }) => {
    if (!amount || amount <= 0) return null; 
    const baseClasses = "absolute flex items-center justify-center text-white font-bold rounded-md shadow-lg z-10";
    if (onRacetrack) {
         return (
             <div className={`${baseClasses} bottom-0 left-1/2 -translate-x-1/2 bg-cyan-500 text-[10px] px-1 py-0.5 rounded-sm border border-cyan-300`}>
                 {formatAmount(amount)}
             </div>
         );
    }
    const amountClasses = "bottom-1 left-1/2 -translate-x-1/2 bg-cyan-500 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border border-cyan-300";
    return (
        <div className={`${baseClasses} ${amountClasses}`}>
            {formatAmount(amount)}
        </div>
    );
};

// --- *** COMPONENT WINNING ANIMATION (BUG 1 FIX) *** ---
const WinningAnimation: FC<{ onRacetrack?: boolean }> = ({ onRacetrack = false }) => {
    const baseClasses = "absolute flex items-center justify-center font-bold shadow-lg z-20";
    if (onRacetrack) {
        return (
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full border border-white animate-bounce z-20"></div>
        );
    }
    // --- FIX: 'left-1/Example' ko 'left-1/2' kiya ---
    const winClasses = "top-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] sm:text-xs font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full border-2 border-yellow-200 shadow-xl animate-bounce";
    return (
        <div className={`${baseClasses} ${winClasses}`}>
            WIN
        </div>
    );
};

// --- Component: NumberBox (No Change) ---
const NumberBox: FC<NumberBoxProps> = ({ number, betAmount, isWinning }) => {
    const isRed = redNumbers.includes(number);
    const isBlack = number !== 0 && !isRed;
    const circleBgColor = isRed ? 'bg-red-600' : isBlack ? 'bg-black' : 'bg-green-600';
    return (
        <div className="relative flex items-center justify-center h-14 sm:h-20 bg-white font-bold text-base sm:text-2xl border-r border-b border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors p-1">
            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white ${circleBgColor} shadow-inner`}>
                {number}
            </div>
            <BetChip amount={betAmount ?? 0} />
            {isWinning && <WinningAnimation />}
        </div>
    );
};

// --- Component: Generic BetBox (No Change) ---
const BetBox: FC<BetBoxProps> = ({ label, className, color, betAmount }) => {
    const bgColor = color === 'red' ? 'bg-red-600' : color === 'black' ? 'bg-black' : 'bg-white';
    const textColor = color ? 'text-white' : 'text-black';
    return (
        <div className={`relative flex items-center justify-center h-14 sm:h-20 text-sm sm:text-lg font-bold border-r border-b border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors ${bgColor} ${textColor} ${className}`}>
            {label}
            <BetChip amount={betAmount ?? 0} />
        </div>
    );
};

// --- Component: RacetrackNumberBox (No Change) ---
const RacetrackNumberBox: FC<RacetrackNumberBoxProps> = ({ number, betAmount, isWinning }) => {
    const isRed = redNumbers.includes(number);
    const isBlack = number !== 0 && !isRed;
    const isGreen = number === 0;
    const bgColor = isRed ? 'bg-red-600' : isBlack ? 'bg-black' : 'bg-green-600';
    return (
        <div className={`relative flex-shrink-0 min-w-[2.5rem] text-white text-sm font-bold flex items-center justify-center cursor-pointer h-full ${bgColor} border-r border-gray-500/20`}>
            {number}
            <BetChip amount={betAmount ?? 0} onRacetrack={true} />
            {isWinning && <WinningAnimation onRacetrack={true} />}
        </div>
    );
};

// --- Racetrack Component (FIX 2) ---
interface RacetrackProps {
    distributedBets: { [key: string]: number }; 
    winningNumber: number | null;
}
const Racetrack: FC<RacetrackProps> = ({ distributedBets, winningNumber }) => {
    return (
        <div className="mt-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 text-center mb-4">Neighbor Bets (Racetrack)</h3>
            <div className="bg-gray-800 p-2 rounded-lg overflow-x-auto border border-gray-300">
                
                {/* Number Track */}
                <div className="flex items-center justify-start h-12 min-w-max bg-gray-600 rounded-md overflow-hidden">
                    {wheelOrder.map(num => (
                        <RacetrackNumberBox 
                            key={`race-${num}`} 
                            number={num} 
                            betAmount={distributedBets[String(num)]} 
                            isWinning={winningNumber === num} 
                        />
                    ))}
                </div>

                {/* --- ⭐️⭐️⭐️ FIX 3: RACETRACK TEXT DESIGN FIX ⭐️⭐️⭐️ --- */}
                <div 
                    className="relative h-10 mt-1 text-white font-semibold text-xs text-center"
                    style={{ minWidth: '92.5rem' }} // Yeh width upar ke 37 numbers (37 * 2.5rem) se match karti hai
                >
                    <div className="flex w-full h-full border-t border-white/50">
                        {/* 1. Initial Gap (jaisa pehle tha) */}
                        <div style={{ flexBasis: '8.5%' }}></div>
                        
                        {/* 2. TIERS */}
                        <div 
                            style={{ flexBasis: '31%' }}
                            className="flex items-center justify-center border-l border-white/50"
                        >
                            TIERS
                        </div>
                        
                        {/* 3. ORPHELINS */}
                        <div 
                            style={{ flexBasis: '21.5%' }}
                            className="flex items-center justify-center border-l border-white/50"
                         >
                            ORPHELINS
                        </div>
                        
                        {/* 4. VOISINS DU */}
                        <div 
                            style={{ flexBasis: '28.5%' }}
                            className="flex items-center justify-center border-l border-white/50"
                        >
                            VOISINS DU
                        </div>
                        
                        {/* 5. ZERO */}
                        <div 
                            style={{ flexBasis: '10%' }}
                            className="flex items-center justify-center border-l border-white/50"
                        >
                            ZERO
                        </div>
                    </div>
                </div>
                {/* --- ⭐️⭐️⭐️ END FIX 3 ⭐️⭐️⭐️ --- */}

            </div>
        </div>
    );
};

const getNeighbourNumbers = (selectionNum: number): number[] => {
    // wheelOrder array [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
    const centerIndex = wheelOrder.indexOf(selectionNum);
    if (centerIndex === -1) {
        return [selectionNum]; // Agar number na mile, toh sirf wahi number bhej do
    }

    const numbers: number[] = [selectionNum];
    const wheelLen = wheelOrder.length;
    const neighbourCount = 2; // Hamesha 2 neighbours fix kar diye

    for (let i = 1; i <= neighbourCount; i++) {
        // Left neighbour
        const leftIndex = (centerIndex - i + wheelLen) % wheelLen;
        numbers.push(wheelOrder[leftIndex]);

        // Right neighbour
        const rightIndex = (centerIndex + i) % wheelLen;
        numbers.push(wheelOrder[rightIndex]);
    }
    
    return numbers;
};

// --- Main GameDashboard Component ---
const GameDashboard: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const handleBack = () => navigate(-1); 

    // *** 1. ADDED STATE TO CHECK ROLE ***
    const [isAdmin, setIsAdmin] = useState(false);

    const handleGoLive = () => {
        navigate('.', { replace: true, state: {} });
    };

    const isHistoryMode = useMemo(() => !!location.state?.roundData, [location.state]);
    const historicalData: RoundData | undefined = location.state?.roundData;
    const betList: BetDetail[] | undefined = location.state?.betList;
    const beforePoints = location.state?.beforePoints;
    const afterPoints = location.state?.afterPoints;
    
    const [activeLiveTable, setActiveLiveTable] = useState<'GREEN' | 'BLUE'>('GREEN');
    const [liveBets, setLiveBets] = useState<BetDetail[]>([]);
    const [liveWinningNumber, setLiveWinningNumber] = useState<number | null>(null);
    const [roundState, setRoundState] = useState<'BETTING' | 'CLOSED' | 'SPINNING'>('BETTING');
    
    // --- BUG 2 FIX: displayTable logic updated ---
    const displayTable = isHistoryMode ? (location.state?.tableLabel || 'GREEN') : activeLiveTable;

    // *** 2. ADDED EFFECT TO SET ROLE ***
    useEffect(() => {
        const role = localStorage.getItem('userRole')?.toLowerCase();
        setIsAdmin(role === 'admin');
    }, []);
    
    // --- *** 3. UPDATED SOCKET.IO LOGIC *** ---
    useEffect(() => {
        // *** ADDED CHECK: Only run sockets if NOT in history mode AND user is Admin ***
        if (isHistoryMode || !isAdmin) {
            console.log("[State] In History Mode or User is not Admin. Sockets disabled.");
            if (socket) {
                socket.disconnect();
                socket = null;
            }
            return; // Don't connect socket
        }

        console.log("[State] Entering Live Mode (Admin). Connecting socket...");
        const token = localStorage.getItem('authToken'); // Apni token key yahan daalein
        if (!token) {
            console.error("Socket Auth Error: No token found.");
            return; 
        }
        if (socket) {
            socket.disconnect();
        }
        socket = io(SOCKET_SERVER_URL, {
            auth: { token: token }
        });
        console.log(`[Socket] Connecting to live table: ${activeLiveTable}`);
        socket.emit('admin_join_table', activeLiveTable, (response: { success: boolean, bets: BetDetail[], error?: string }) => {
            if (response.success) {
                console.log(`[Socket] Received initial bets for ${activeLiveTable}:`, response.bets);
                setLiveBets(response.bets);
                setLiveWinningNumber(null);
                setRoundState('BETTING');
            } else {
                console.error(response.error);
            }
        });
        socket.on('new_bet_placed', (newBet: BetDetail) => {
            console.log('[Socket] New bet received:', newBet);
            setLiveBets(prevBets => [...prevBets, newBet]);
        });
        socket.on('round_started', () => {
            console.log('[Socket] New round started!');
          setLiveBets([]); 
            setLiveWinningNumber(null); 
            setRoundState('BETTING');
        });
        socket.on('bets_closed', () => {
            console.log('[Socket] Bets are closed.');
            setRoundState('CLOSED');
        });
        socket.on('result', (data: { outcome: { number: number } }) => {
            console.log('[Socket] Result received:', data.outcome.number);
            setLiveWinningNumber(data.outcome.number);
            setRoundState('SPINNING');
        });
        return () => {
            console.log('[Socket] Disconnecting...');
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        };
    }, [isHistoryMode, activeLiveTable, isAdmin]); // *** Added isAdmin to dependency array ***
    
    
    // --- *** DATA PROCESSING LOGIC (Unchanged) *** ---
    const { numberBets, gridOutsideBets, racetrackDistributedBets } = useMemo(() => {
        
        // Step 1: Chuno kaunsi list process karni hai
        const betsToProcess = isHistoryMode ? betList : liveBets;
        
        const numBets: { [key: string]: number } = {};      // For number boxes (1-36, 0)
        const gridBets: { [key: string]: number } = {};    // For category boxes (Dozen, Color, etc.)
        const raceBets: { [key: string]: number } = {};    // For racetrack numbers

        if (!betsToProcess) {
            return { numberBets: numBets, gridOutsideBets: gridBets, racetrackDistributedBets: raceBets };
        }

        // Helper function to distribute stake
        const distributeToNumbers = (numbers: number[], stake: number) => {
            if (numbers.length === 0) return;
            const stakePerNumber = stake / numbers.length;
            numbers.forEach(num => {
                numBets[String(num)] = (numBets[String(num)] || 0) + stakePerNumber;
            });
        };

        // Step 2: Har bet ko process karo
        for (const bet of betsToProcess) {
            // 'type' (live) ya 'betType' (history) dono ko check karo
            const type = (bet.type || bet.betType)?.toLowerCase();
            const selection = bet.selection?.toUpperCase();
            const stake = bet.stake;

            if (!type || !stake) continue; // Invalid bet ko skip karo

            let numbers: number[] = [];

            switch (type) {
                // --- A. RACETRACK BETS (Distribute to raceBets) ---
                case 'voisins':
                    // Yahan VOISINS_NUMBERS (jo ab fix ho chuka hai) use hoga
                    const stakePerVoisins = stake / VOISINS_NUMBERS.length;
                    VOISINS_NUMBERS.forEach(num => raceBets[String(num)] = (raceBets[String(num)] || 0) + stakePerVoisins);
                    break;
                case 'tiers':
                    const stakePerTiers = stake / TIERS_NUMBERS.length;
                    TIERS_NUMBERS.forEach(num => raceBets[String(num)] = (raceBets[String(num)] || 0) + stakePerTiers);
                    break;
                case 'orphelins':
                    const stakePerOrphelins = stake / ORPHELINS_NUMBERS.length;
                    ORPHELINS_NUMBERS.forEach(num => raceBets[String(num)] = (raceBets[String(num)] || 0) + stakePerOrphelins);
                    break;
                case 'zero_splits':
                case 'jeu_zero': 
                   const stakePerZeroSpiel = stake / ZERO_SPIEL_NUMBERS.length;
                    ZERO_SPIEL_NUMBERS.forEach(num => raceBets[String(num)] = (raceBets[String(num)] || 0) + stakePerZeroSpiel);
                    break;

                // --- B. MAIN GRID: NUMBER BETS (Distribute to numBets) ---
                case 'straight':
                    if (selection) numBets[selection] = (numBets[selection] || 0) + stake;
                    break;
                case 'split':
                    if (selection && (selection.includes('-') || selection.includes('/'))) {
                        numbers = selection.split(/-|\//).map(Number).filter(n => !isNaN(n));
                        distributeToNumbers(numbers, stake); // Use helper
                    }
                    break;
                case 'street':
                    if (selection && selection.includes('-')) {
                        numbers = selection.split('-').map(Number).filter(n => !isNaN(n));
                        distributeToNumbers(numbers, stake); // Use helper
                    }
                    break;
                case 'corner':
                    if (selection && selection.includes('-')) {
                        numbers = selection.split('-').map(Number).filter(n => !isNaN(n));
                        distributeToNumbers(numbers, stake); // Use helper
                    }
                    break;
                case 'line':
                    if (selection && selection.includes('-')) {
                        numbers = selection.split('-').map(Number).filter(n => !isNaN(n));
                        distributeToNumbers(numbers, stake); // Use helper
                    }
                    break;
                case 'neighbour':
                if (selection) {
                    const selectionNum = parseInt(selection, 10);
                    
                    if (!isNaN(selectionNum)) {
                        // Naye helper function ko call karein (yeh 5 numbers dega)
                        numbers = getNeighbourNumbers(selectionNum); 
                        
                        // Stake ko 5 numbers par divide karke main 0-36 grid par add karein
                        distributeToNumbers(numbers, stake);
                        
                        // (Optional) Stake ko Racetrack par bhi dikhayein
                        const stakePerNeighbour = stake / numbers.length;
                        numbers.forEach(num => raceBets[String(num)] = (raceBets[String(num)] || 0) + stakePerNeighbour);
                    }
                }
                break;
                // --- C. MAIN GRID: OUTSIDE BETS (Add to gridBets AND distribute to numBets) ---
                case 'dozen':
                    let dozenNumbers: number[] = [];
                    if (selection === 'D1') {
                        gridBets['1st 12'] = (gridBets['1st 12'] || 0) + stake;
                        dozenNumbers = DOZEN_MAP['D1'];
                    } else if (selection === 'D2') {
                        gridBets['2nd 12'] = (gridBets['2nd 12'] || 0) + stake;
                        dozenNumbers = DOZEN_MAP['D2'];
                    } else if (selection === 'D3') {
                        gridBets['3rd 12'] = (gridBets['3rd 12'] || 0) + stake;
                        dozenNumbers = DOZEN_MAP['D3'];
                   }
                    distributeToNumbers(dozenNumbers, stake); // Distribute
                    break;
                    
                case 'column':
                    let columnNumbers: number[] = [];
                    if (selection === 'C1') {
                        gridBets['2:1_C1'] = (gridBets['2:1_C1'] || 0) + stake;
                        columnNumbers = COLUMN_MAP['C1'];
                    } else if (selection === 'C2') {
                        gridBets['2:1_C2'] = (gridBets['2:1_C2'] || 0) + stake;
                        columnNumbers = COLUMN_MAP['C2'];
                    } else if (selection === 'C3') {
                        gridBets['2:1_C3'] = (gridBets['2:1_C3'] || 0) + stake;
                        columnNumbers = COLUMN_MAP['C3'];
                    }
                    distributeToNumbers(columnNumbers, stake); // Distribute
                    break;
                    
                case 'parity':
                    let parityNumbers: number[] = [];
                    if (selection === 'ODD') {
                        gridBets['ODD'] = (gridBets['ODD'] || 0) + stake;
                        parityNumbers = PARITY_MAP['ODD'];
                    } else if (selection === 'EVEN') {
                        gridBets['EVEN'] = (gridBets['EVEN'] || 0) + stake;
                        parityNumbers = PARITY_MAP['EVEN'];
                    }
                    distributeToNumbers(parityNumbers, stake); // Distribute
                    break;
                    
                case 'range':
                    let rangeNumbers: number[] = [];
                    if (selection === 'LOW' || selection === '1-18') {
                     gridBets['1-18'] = (gridBets['1-18'] || 0) + stake;
                       rangeNumbers = RANGE_MAP['LOW'];
                    } else if (selection === 'HIGH' || selection === '19-36') {
                       gridBets['19-36'] = (gridBets['19-36'] || 0) + stake;
                        rangeNumbers = RANGE_MAP['HIGH'];
                    }
                    distributeToNumbers(rangeNumbers, stake); // Distribute
                    break;
                
                // --- D. COLOR BETS (Add to gridBets AND distribute to numBets) ---
                case 'color':
                    let colorNumbers: number[] = [];
                 if (selection === 'RED') {
                        colorNumbers = COLOR_MAP['RED'];
                    } else if (selection === 'BLACK') {
                   colorNumbers = COLOR_MAP['BLACK'];
                    }
                    distributeToNumbers(colorNumbers, stake); // Distribute
                    break;

                // --- ⭐️⭐️⭐️ FIX 3: RED/BLACK SPLITS LOGIC REPLACED ⭐️⭐️⭐️ ---
                case 'red_splits':
                    // Yahan stake ko 'gridBets['RED']' par ADD NAHIN KARENGE.
                    // Stake ko sirf specific splits par distribute karenge.
                    gridBets['RED'] = (gridBets['RED'] || 0) + stake;
                    const stakePerRedSplit = stake / RED_SPLITS_SELECTIONS.length;
                    RED_SPLITS_SELECTIONS.forEach(splitSelection => {
                        // splitSelection '9/12' jaisa hoga
                        const splitNumbers = splitSelection.split('/').map(Number).filter(n => !isNaN(n));
                        // distributeToNumbers [9, 12] numbers par stakePerRedSplit ko distribute karega
                        distributeToNumbers(splitNumbers, stakePerRedSplit);
                    });
                    break;

                case 'black_splits':
                    // Yahan bhi stake ko 'gridBets['BLACK']' par ADD NAHIN KARENGE.
                    gridBets['BLACK'] = (gridBets['BLACK'] || 0) + stake;
                    const stakePerBlackSplit = stake / BLACK_SPLITS_SELECTIONS.length;
                    BLACK_SPLITS_SELECTIONS.forEach(splitSelection => {
                        const splitNumbers = splitSelection.split('/').map(Number).filter(n => !isNaN(n));
                        distributeToNumbers(splitNumbers, stakePerBlackSplit);
                   });
                    break;
                // --- ⭐️⭐️⭐️ END FIX 3 ⭐️⭐️⭐️ ---
                        
                default:
                    break;
            }
        }
        return { 
            numberBets: numBets,
         gridOutsideBets: gridBets,
            racetrackDistributedBets: raceBets
        };
    }, [isHistoryMode, betList, liveBets]);
    // --- *** // --- END: DATA PROCESSING LOGIC *** ---
    
    // --- Winning Number (No Change) ---
    const winningNumber = isHistoryMode ? historicalData?.winningNumber ?? null : liveWinningNumber;

    // --- Total Calculation (No Change) ---
    const { totalPlayPoints, totalWinAmount, netProfitLoss } = useMemo(() => {
        const betsToProcess = isHistoryMode ? betList : liveBets;
        if (!betsToProcess) { 
            return { totalPlayPoints: 0, totalWinAmount: 0, netProfitLoss: 0 };
        }
        const playPoints = betsToProcess.reduce((sum, bet) => sum + (bet.stake || 0), 0);

        if (isHistoryMode) {
            const winAmount = historicalData?.totalWinningAmount ?? 0;
            return { totalPlayPoints: playPoints, totalWinAmount: winAmount, netProfitLoss: winAmount - playPoints };
     } else {
            return { totalPlayPoints: playPoints, totalWinAmount: 0, netProfitLoss: 0 };
        }
    }, [isHistoryMode, betList, historicalData, liveBets]);

    // --- getWinningNumberStyle (No Change) ---
    const getWinningNumberStyle = (num: number | null) => {
        if (num === null || num === undefined) return 'text-gray-500';
        if (num === 0) return 'bg-green-600 text-white';
        if (redNumbers.includes(num)) return 'bg-red-600 text-white';
        return 'bg-black text-white';
    };

        // --- *** ⭐️⭐️⭐️ FIX 1: BUTTONS FIX ⭐️⭐️⭐️ --- ***
    const getButtonClasses = (tableType: 'GREEN' | 'BLUE') => {
        const currentActiveTable = isHistoryMode ? (location.state?.tableLabel || 'GREEN') : activeLiveTable;
        const isActive = currentActiveTable === tableType;
        
        const base = "items-center justify-center w-full sm:w-auto px-4 py-2 text-sm sm:px-8 sm:py-3 sm:text-xl md:px-24 md:py-4 md:text-2xl font-bold text-white rounded-xl transition-all duration-200 transform shadow-lg hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed";
        
        let colorClasses = "";
        
        if (tableType === 'GREEN') {
            colorClasses = "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800";
        } else {
            colorClasses = "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800";
        }
        
        let stateClasses = "";
        if (!isActive) {
            stateClasses = "opacity-60"; 
        }

        if (isHistoryMode) {
            stateClasses += " cursor-not-allowed"; 
        }
        
        return `${base} ${colorClasses} ${stateClasses}`;
    };
        
    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 p-2 sm:p-6">
            <style>{`.grid-cols-13 { grid-template-columns: repeat(13, 1fr); }`}</style>
            <div className="max-w-7xl mx-auto">
                <div className="p-2 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200">
                    
                    {/* --- ⭐️⭐️⭐️ FIX 1: HEADER LAYOUT FIX ⭐️⭐️⭐️ --- */}
                    <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                        <button 
                            onClick={handleBack} 
                            // --- FIX: Back button ko sm par auto width diya taaki left align rahe ---
                            className="flex w-full sm:w-auto items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 text-white font-semibold rounded-lg shadow-md transform transition-all hover:scale-105"
                        >
                            <ChevronLeft size={20} />
                          Back
                        </button>
                        
                        {/* --- *** 4. UPDATED: Button group ab sirf Admin ko dikhega *** --- */}
                        {isAdmin && (
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => !isHistoryMode && setActiveLiveTable('GREEN')}
                                  className={getButtonClasses('GREEN')}
                                >
                                    Green Table
                                </button>
                                <button 
                                    onClick={() => !isHistoryMode && setActiveLiveTable('BLUE')}
                                    className={getButtonClasses('BLUE')}
                                >
                                   Blue Table
                                </button>

                                {isHistoryMode && (
                                    <button 
                                        onClick={handleGoLive}
                                        // --- FIX: Go Live button ko bhi w-full diya mobile ke liye ---
                                        className="px-4 py-2 w-full sm:w-auto font-semibold rounded-lg shadow-md transition-colors bg-red-600 text-white hover:bg-red-700 animate-pulse"
                                  >
                                        🔴 Go Live
                                   </button>
                                )}
                            </div>
                      )}
                        {/* --- ⭐️⭐️⭐️ END FIX 1 ⭐️⭐️⭐️ --- */}
                   </div>

                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl text-center font-bold text-gray-800">
                            {/* --- *** 5. UPDATED: Title changes based on role *** --- */}
                            {isHistoryMode || !isAdmin ? 'Viewing Round History' : 'Live Bet Table'}
                            <span className={`ml-2 px-3 py-1 rounded-full text-lg ${displayTable === 'GREEN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {displayTable}
                            </span>
                      </h2>
                    </div>
                    {isHistoryMode && (
                        <div className="mb-8 border rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                            <table className="w-full min-w-[500px] text-sm sm:text-base text-center text-gray-700">
                                <thead className="text-xs text-gray-600 uppercase bg-gray-200 font-semibold">
                                    <tr>
                                        <th className="px-2 sm:px-6 py-3">Before Points</th>
                                      <th className="px-2 sm:px-6 py-3">Total Play Points</th>
                                        <th className="px-2 sm:px-6 py-3">Winning Number</th>
                                    <th className="px-2 sm:px-6 py-3">Total Win Amount</th>
                                        <th className="px-2 sm:px-6 py-3">After Points</th>
                                        <th className="px-2 sm:px-6 py-3">Profit / Loss</th>
                                </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-white">
                                        <td className="px-2 sm:px-6 py-4 font-bold text-gray-500">
                                            {formatPoints(beforePoints)}
                                    </td>
                                        <td className="px-2 sm:px-6 py-4 font-bold text-gray-800">
                                         {totalPlayPoints.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-2 sm:px-6 py-4">
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full flex items-center justify-center font-bold text-lg sm:text-xl ${getWinningNumberStyle(winningNumber)}`}>
                                                {winningNumber ?? '-'}
                                            </div>
                                </td>
                                        <td className="px-2 sm:px-6 py-4 font-bold text-green-600">
                                        {totalWinAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-2 sm:px-6 py-4 font-bold text-gray-500">
                                            {formatPoints(afterPoints)}
                                        </td>
                                   <td className={`px-2 sm:px-6 py-4 font-bold ${netProfitLoss >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                            {netProfitLoss.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                </tbody>
                    	       </table>
                        </div>
                    )}

                    {/* --- *** 6. UPDATED: Live Stake Display (Sirf Admin aur Live Mode) *** --- */}
                  {!isHistoryMode && isAdmin && (
                        <div className="mb-4 text-center p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700">Total Live Stake</h3>
                            <p className="text-3xl font-bold text-gray-900">
                                {totalPlayPoints.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                            </p>
            	             {roundState === 'CLOSED' && (
                                <p className="text-xl font-bold text-red-600 animate-pulse mt-2">NO MORE BETS</p>
                            )}
                        </div>
                    )}
                    
                    {/* --- Main Grid & Racetrack (Ab consistent dikhega) --- */}
                  <div className="border-l border-t border-gray-300 overflow-x-auto">
                      <div className="grid grid-cols-[1fr,13fr] min-w-[750px]">
                            <div className="row-span-3">
                                <NumberBox number={0} betAmount={numberBets['0']} isWinning={winningNumber === 0} />
                            </div>
                            <div className="grid grid-cols-13">
                                {/* Row 3 */}
                                {[...Array(12)].map((_, i) => {
                                    const num = 3 + i * 3;
                                  return <NumberBox key={num} number={num} betAmount={numberBets[String(num)]} isWinning={winningNumber === num} />
                                })}
                                <BetBox label="2:1" betAmount={gridOutsideBets['2:1_C3']} />
                                {/* Row 2 */}
                                {[...Array(12)].map((_, i) => {
                                    const num = 2 + i * 3;
                                    return <NumberBox key={num} number={num} betAmount={numberBets[String(num)]} isWinning={winningNumber === num} />
                                })}
                               <BetBox label="2:1" betAmount={gridOutsideBets['2:1_C2']} />
                                {/* Row 1 */}
                                {[...Array(12)].map((_, i) => {
                                    const num = 1 + i * 3;
                                    return <NumberBox key={num} number={num} betAmount={numberBets[String(num)]} isWinning={winningNumber === num} />
                                })}
                                <BetBox label="2:1" betAmount={gridOutsideBets['2:1_C1']} />
                        </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-6 text-center">
                   <BetBox label="1st 12" className="col-span-1 sm:col-span-2" betAmount={gridOutsideBets['1st 12']} />
                        <BetBox label="2nd 12" className="col-span-1 sm:col-span-2" betAmount={gridOutsideBets['2nd 12']} />
                   <BetBox label="3rd 12" className="col-span-1 sm:col-span-2" betAmount={gridOutsideBets['3rd 12']} />
                        <BetBox label="1-18" betAmount={gridOutsideBets['1-18']} />
                        <BetBox label="EVEN" betAmount={gridOutsideBets['EVEN']} />
                        <BetBox label="◆" color="red" betAmount={gridOutsideBets['RED']} />
                        <BetBox label="◆" color="black" betAmount={gridOutsideBets['BLACK']} />
                      <BetBox label="ODD" betAmount={gridOutsideBets['ODD']} />
                        <BetBox label="19-36" betAmount={gridOutsideBets['19-36']} />
                    </div>
                    
                    <Racetrack 
                        distributedBets={racetrackDistributedBets} 
                        winningNumber={winningNumber} 
                    />
                </div>
          </div>
        </div>
    );
};

export default GameDashboard;