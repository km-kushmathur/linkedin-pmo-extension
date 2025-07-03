// src/js/ai-classifier.js
// Dynamic import to reduce initial bundle size

class AIClassifier {
    constructor() {
        this.classifier = null;
        this.initialized = false;
        this.initializationPromise = null;
        this.confidenceThreshold = 0.7; // More reasonable threshold
        this.pipeline = null; // Will be loaded dynamically
    }

    async initialize() {
        if (this.initialized) return;
        
        // Prevent race conditions during initialization
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    async _doInitialize() {
        try {
            console.log('AI Classifier: Loading Transformers.js library...');
            
            // Dynamic import to reduce initial bundle size
            const { pipeline } = await import('@xenova/transformers');
            this.pipeline = pipeline;
            
            console.log('AI Classifier: Initializing sentiment analysis model...');
            this.classifier = await this.pipeline(
                'sentiment-analysis',
                'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
            );
            this.initialized = true;
            console.log('AI Classifier: Model initialized successfully');
        } catch (error) {
            console.error('AI Classifier: Failed to initialize model:', error);
            this.initialized = false;
            this.initializationPromise = null;
            throw new Error(`Failed to initialize AI classifier: ${error.message}`);
        }
    }

    async classifyPost(text) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                return false;
            }

            const result = await this.classifier(text);
            
            if (!result || !Array.isArray(result) || result.length === 0) {
                console.warn('AI Classifier: Invalid result from sentiment analysis');
                return false;
            }

            // Improved regex with word boundaries and more patterns
            const braggyPatterns = [
                /\b(?:announce|excited|thrilled|landed|internship|milestone|achievement|promotion|proud)\b/i,
                /\b(?:happy to share|starting a new position|new position|new job|humbled|grateful)\b/i,
                /\b(?:delighted|pleased|honored|accepted|offer|role|position|opportunity|dream)\b/i,
                /\b(?:blessed|fortunate|amazing opportunity|incredible journey|next chapter)\b/i,
                /\b(?:career|professional|growth|success|accomplishment|breakthrough)\b/i
            ];

            const braggy = braggyPatterns.some(pattern => pattern.test(text));
            
            const sentiment = result[0];
            const isPositive = sentiment.label === 'POSITIVE';
            const hasHighConfidence = sentiment.score > this.confidenceThreshold;
            const shouldFilter = braggy && isPositive && hasHighConfidence;

            console.log("AI Classifier: Post analysis:", {
                isBraggy: braggy,
                sentiment: sentiment.label,
                score: sentiment.score.toFixed(3),
                confidenceThreshold: this.confidenceThreshold,
                shouldFilter,
                textSnippet: text.substring(0, 100) + "..."
            });

            return shouldFilter;

        } catch (error) {
            console.error('AI Classifier: Error during classification:', error);
            // Fallback to basic regex matching if AI fails
            const basicBraggyPattern = /\b(?:excited|thrilled|proud|announce|happy to share|new job|new position)\b/i;
            const fallbackResult = basicBraggyPattern.test(text);
            console.log('AI Classifier: Using fallback classification:', fallbackResult);
            return fallbackResult;
        }
    }

    // Method to update confidence threshold
    setConfidenceThreshold(threshold) {
        if (typeof threshold === 'number' && threshold >= 0 && threshold <= 1) {
            this.confidenceThreshold = threshold;
            console.log(`AI Classifier: Confidence threshold updated to ${threshold}`);
        } else {
            console.warn('AI Classifier: Invalid confidence threshold. Must be between 0 and 1.');
        }
    }

    dispose() {
        this.classifier = null;
        this.initialized = false;
        this.initializationPromise = null;
        console.log('AI Classifier: Disposed');
    }
}

export const aiClassifier = new AIClassifier();