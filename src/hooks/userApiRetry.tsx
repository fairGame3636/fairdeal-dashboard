const useApiRetry = (maxRetries = 3) => {
    // Basic delay function
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchWithRetry = async (url: string, options: RequestInit) => {
        let lastError: Error | null = null;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Exponential backoff delay (1s, 2s, 4s...)
                if (i > 0) {
                    const waitTime = Math.pow(2, i) * 1000;
                    console.log(`Retrying API call in ${waitTime}ms... (Attempt ${i + 1}/${maxRetries})`);
                    await delay(waitTime);
                }

                const response = await fetch(url, options);

                // Return response immediately if a response object is received (Network layer will handle status codes)
                return response;

            } catch (error) {
                lastError = error as Error;
                // Log the network error but don't stop the loop until maxRetries is hit
                console.error(`Network attempt ${i + 1} failed:`, error);
            }
        }
        
        // If the loop finishes without a successful response, throw the last network error
        throw new Error(`Failed to connect to the server after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    };

    return fetchWithRetry;
};
