import React, { useState, useEffect } from 'react';
// --- UPDATED --- (Added 'Target' icon for ENDPOINTS, but you can use 'Calendar' again)
import { Settings, Percent, Calendar, Hash, Shuffle, Table, Target } from 'lucide-react';
import GameControlService from '../../services/GameService';
import { GameTable, DecideResultPayload } from '../../modals/Game';

// --- (1) TYPE DEFINITIONS ---
// --- UPDATED: Added 'ENDPOINTS' type ---
type ResultType = 'FIX' | 'NET' | 'RND' | 'ROUND' | 'ENDPOINTS';

// --- (2) HELPER & STYLING COMPONENTS (Unchanged) ---
const InputField: React.FC<{
    id: string;
    label: string;
    type: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    min?: number;
    max?: number;
}> = ({ id, label, type, value, onChange, placeholder, required, min, max }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            max={max}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        />
    </div>
);

// --- (3) MAIN RESULT CONTROL COMPONENT ---
function ResultControlPage() {
    // State for API data
    const [tables, setTables] = useState<GameTable[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string>('');
    
    // State for form inputs
    // --- UPDATED: Added 'ENDPOINTS' to ResultType ---
    const [resultType, setResultType] = useState<ResultType>('FIX');
    const [fixNumber, setFixNumber] = useState<string>('0');
    const [netStartDate, setNetStartDate] = useState('');
    const [netEndDate, setNetEndDate] = useState('');
    const [netPercentage, setNetPercentage] = useState(''); // Used for both NET and ENDPOINTS
    const [roundPercentage, setRoundPercentage] = useState('');

    // State for UI feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTables, setIsLoadingTables] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // --- (Helper function to update form based on table settings) ---
    // This logic already supports 'ENDPOINTS' because 'ENDPOINTS'
    // uses 'winningType' and 'winning_percentage' just like NET and ROUND.
    const updateFormFields = (tableId: string, tablesData: GameTable[]) => {
        const table = tablesData.find(t => t._id === tableId);
        if (table) {
            console.log("Updating fields for table:", table.name, table);
            
            // --- UPDATED: 'ENDPOINTS' will be set correctly here ---
            setResultType((table.winningType as ResultType) || 'FIX');
            setFixNumber(String(table.winning_number ?? 0));
            
            // winning_percentage ko NET, ROUND, aur ENDPOINTS ke liye use karo
            const percentage = String(table.winning_percentage ?? 0);
            setNetPercentage(percentage); // For NET and ENDPOINTS
            setRoundPercentage(percentage); // For ROUND

            // Date fields reset karo (kyunki yeh table mein save nahi hote)
            setNetStartDate('');
            setNetEndDate('');
        }
    };

    // (Component ke andar, return se pehle yeh function daalein)


    const formatPayloadDate = (dateString: string): string => {
        if (!dateString) return ''; // Agar date nahi hai toh empty string

        try {
            // dateString = "2025-11-05" (YYYY-MM-DD)
            const parts = dateString.split('-'); // ["2025", "11", "05"] (Y, M, D)

            if (parts.length === 3) {
                // Backend ko MM-DD-YYYY chahiye
                return `${parts[1]}-${parts[2]}-${parts[0]}`; // "11-05-2025"
            }
            return dateString; // Fallback
        } catch (e) {
            console.error("Date formatting error:", e);
            return dateString; // Error par original value
        }
    };

    // --- (Fetch tables on component mount) ---
    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await GameControlService.getAllTables();
                if (response.success && response.data) {
                    console.log("Get all table's data", response.data);
                    const loadedTables = response.data;
                    setTables(loadedTables);
                    
                    if (loadedTables.length > 0) {
                        const firstTableId = loadedTables[0]._id;
                        setSelectedTableId(firstTableId);
                        
                        // Page load par form ko pehli table ki settings se bharo
                        updateFormFields(firstTableId, loadedTables);
                    }
                } else {
                    setFeedback({ type: 'error', message: response.message || 'Failed to load tables.' });
                }
            } catch (error) {
                setFeedback({ type: 'error', message: 'An error occurred while fetching tables.' });
            } finally {
                setIsLoadingTables(false);
            }
        };
        fetchTables();
    }, []); // Empty array sahi hai, yeh ek baar chalta hai

    // (useEffect for feedback - Unchanged)
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => {
                setFeedback(null);
            }, 2000);
            return () => {
                clearTimeout(timer);
            };
        }
    }, [feedback]); 

    // (handleTypeChange - Unchanged)
    // This already works for ENDPOINTS, it will clear all fields.
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as ResultType;
        setResultType(newType);
        // Reset values when user *manually* changes type
        setFixNumber('0');
        setNetStartDate('');
        setNetEndDate('');
        setNetPercentage('');
        setRoundPercentage('');
        setFeedback(null);
    };
    
    // (handleSubmit - UPDATED)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        if (!selectedTableId) {
            setFeedback({ type: 'error', message: 'Please select a table.' });
            setIsSubmitting(false);
            return;
        }

        // --- UPDATED: Validation ---
        if (resultType === 'FIX') {
            const num = parseInt(fixNumber);
            if (isNaN(num) || num < 0 || num > 37) { // Assuming 37 for 00
                setFeedback({ type: 'error', message: 'Please enter a valid number between 0 and 37.' });
                setIsSubmitting(false);
                return;
            }
        }
        
        // --- UPDATED: Added validation for ENDPOINTS (uses netPercentage) ---
        if (
            ((resultType === 'NET' || resultType === 'ENDPOINTS') && !netPercentage) || 
            (resultType === 'ROUND' && !roundPercentage)
        ) {
            setFeedback({ type: 'error', message: 'Percentage is required for this result type.' });
            setIsSubmitting(false);
            return;
        }

        // --- Construct API Payload ---
        const payload: DecideResultPayload = {
            table_id: selectedTableId,
            type: resultType,
        };

        if (resultType === 'FIX') payload.winning_number = parseInt(fixNumber);
        if (resultType === 'ROUND') payload.winning_percentage = parseFloat(roundPercentage);
        
        // --- UPDATED: Added ENDPOINTS to payload logic ---
        if (resultType === 'NET' || resultType === 'ENDPOINTS') {
            payload.winning_percentage = parseFloat(netPercentage);
            if (netStartDate) payload.startDate = formatPayloadDate(netStartDate);
            if (netEndDate) payload.endDate = formatPayloadDate(netEndDate);
        }

        // --- API Call ---
        try {
            const response = await GameControlService.decideResult(payload);
            if (response.success && response.data) {
                setFeedback({ type: 'success', message: response.data.message || 'Result submitted successfully!' });
                
                const updatedTables: GameTable[] = tables.map(table => {
                    if (table._id === selectedTableId) {
                        
                        let newWinningPercentage: number | undefined = undefined;
                        if (resultType === 'ROUND') {
                            newWinningPercentage = parseFloat(roundPercentage);
                        } else if (resultType === 'NET' || resultType === 'ENDPOINTS') {
                            newWinningPercentage = parseFloat(netPercentage);
                        }

                        return {
                            ...table,
                            // Cast resultType into the existing GameTable winningType shape
                            winningType: resultType as unknown as GameTable['winningType'],
                            winning_number: resultType === 'FIX' ? parseInt(fixNumber) : undefined,
                            winning_percentage: newWinningPercentage,
                            winning_amount: (resultType === 'NET' || resultType === 'ENDPOINTS') ? table.winning_amount : undefined 
                        } as GameTable;
                    }
                    return table;
                });
                setTables(updatedTables);

            } else {
                throw new Error(response.message || 'Failed to submit result.');
            }
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-xl mx-auto">
                {/* Header (Unchanged) */}
                <div className="mt-8 bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border-2 border-green-200 text-center">
                    <h1 className="text-xl sm:text-3xl font-bold text-green-800 flex items-center justify-center gap-2">
                        <Settings className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                        Decide Game Result
                    </h1>
                    <p className="text-sm sm:text-lg text-green-600 mt-1">Select a table and result type to configure its parameters.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-green-200">
                    {feedback && (
                        <div className={`border px-4 py-3 rounded-xl relative mb-6 text-center shadow-sm ${
                            feedback.type === 'success' 
                            ? 'bg-green-100 border-green-400 text-green-800' 
                            : 'bg-red-100 border-red-400 text-red-800'
                        }`}>
                            {feedback.message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="selectedTable" className="block text-base font-semibold text-gray-700 mb-2">Choose Table</label>
                            <select 
                                id="selectedTable" 
                                value={selectedTableId} 
                                // (Table change logic - Unchanged)
                                onChange={(e) => {
                                    const newTableId = e.target.value;
                                    setSelectedTableId(newTableId);
                                    // Form ko naye table ki settings se update karo
                                    updateFormFields(newTableId, tables);
                                    setFeedback(null); // Puraana feedback clear karo
                                }}
                                disabled={isLoadingTables}
                                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white disabled:bg-gray-100"
                            >
                                {isLoadingTables ? (
                                    <option>Loading tables...</option>
                                ) : (
                                    tables.map(table => (
                                        <option key={table._id} value={table._id}>{table.name.toUpperCase()}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="resultType" className="block text-base font-semibold text-gray-700 mb-2">Result Type</label>
                            <select 
                                id="resultType" 
                                value={resultType} 
                                onChange={handleTypeChange} // Yeh manual change ke liye hai
                                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white"
                            >
                                <option value="FIX">FIX</option>
                                <option value="NET">NET</option>
                                {/* --- UPDATED: Added ENDPOINTS option --- */}
                                <option value="ENDPOINTS">ENDPOINTS</option>
                                <option value="RND">RND</option>
                                <option value="ROUND">ROUND</option>
                            </select>
                        </div>
                        
                        <hr className="border-gray-200"/>

                        <div className="animate-fadeIn">
                            {resultType === 'FIX' && (
                                <div className="space-y-4">
                                    <h2 className="font-semibold text-base sm:text-lg text-gray-800 flex items-center gap-2"><Hash size={20}/> Configure FIX Result</h2>
                                    <InputField 
                                        id="fixNumber" label="Winning Number" type="number"
                                        value={fixNumber} onChange={(e) => setFixNumber(e.target.value)}
                                        placeholder="0-36" required={true} min={0} max={37}
                                    />
                                </div>
                            )}

                            {/* --- UPDATED: Show this block for NET or ENDPOINTS --- */}
                            {(resultType === 'NET' || resultType === 'ENDPOINTS') && (
                                <div className="space-y-4">
                                    {/* --- UPDATED: Dynamic title --- */}
                                    <h2 className="font-semibold text-base sm:text-lg text-gray-800 flex items-center gap-2">
                                        {resultType === 'NET' ? <Calendar size={20}/> : <Target size={20}/>}
                                        Configure {resultType} Result
                                    </h2>
                                    <InputField 
                                        id="netStartDate" label="Start Date" type="date"
                                        value={netStartDate} onChange={(e) => setNetStartDate(e.target.value)}
                                    />
                                    <InputField 
                                        id="netEndDate" label="End Date" type="date"
                                        value={netEndDate} onChange={(e) => setNetEndDate(e.target.value)}
                                    />
                                    <InputField 
                                        id="netPercentage" label="Percentage" type="number"
                                        // --- UPDATED: This field is now shared ---
                                        value={netPercentage} onChange={(e) => setNetPercentage(e.target.value)}
                                        placeholder="e.g., 75" required={true}
                                    />
                                </div>
                            )}

                             {resultType === 'ROUND' && (
                                <div className="space-y-4">
                                    <h2 className="font-semibold text-base sm:text-lg text-gray-800 flex items-center gap-2"><Percent size={20}/> Configure ROUND Result</h2>
                                    <InputField 
                                        id="roundPercentage" label="Percentage" type="number"
                                        value={roundPercentage} onChange={(e) => setRoundPercentage(e.target.value)}
                                        placeholder="e.g., 50" required={true}
                                    />
                                </div>
                            )}
                             {resultType === 'RND' && (
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <h2 className="font-semibold text-base sm:text-lg text-gray-800 flex items-center justify-center gap-2"><Shuffle size={20}/> RND (Random) Result</h2>
                                    <p className="text-sm sm:text-base text-gray-600 mt-1">No further configuration is needed. The result will be generated randomly.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={isSubmitting || isLoadingTables} 
                                className="w-full px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-bold text-white rounded-xl transition-all duration-300 shadow-lg disabled:cursor-not-allowed disabled:bg-green-300 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7R00 transform hover:scale-105">
                                {isSubmitting ? 'Submitting...' : 'Submit Result'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ResultControlPage;