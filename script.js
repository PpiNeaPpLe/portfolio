// Export both classes using ES module syntax
export class AudioStreamer {
    constructor(context) {
        this.context = context;
        this.audioQueue = [];
        this.isPlaying = false;
        this.sampleRate = 24000;
        this.bufferSize = 7680;
        this.processingBuffer = new Float32Array(0);
        this.scheduledTime = 0;
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
        this.isStreamComplete = false;
        this.checkInterval = null;
    }

    addPCM16(chunk) {
        // Convert base64 to binary data
        const binaryStr = atob(chunk);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        // Convert to Float32 for Web Audio API
        const float32Array = new Float32Array(bytes.length / 2);
        const dataView = new DataView(bytes.buffer);
        
        for (let i = 0; i < bytes.length / 2; i++) {
            const int16 = dataView.getInt16(i * 2, true);
            float32Array[i] = int16 / 32768.0;
        }

        // Add to processing buffer
        const newBuffer = new Float32Array(this.processingBuffer.length + float32Array.length);
        newBuffer.set(this.processingBuffer);
        newBuffer.set(float32Array, this.processingBuffer.length);
        this.processingBuffer = newBuffer;

        while (this.processingBuffer.length >= this.bufferSize) {
            const buffer = this.processingBuffer.slice(0, this.bufferSize);
            this.audioQueue.push(buffer);
            this.processingBuffer = this.processingBuffer.slice(this.bufferSize);
        }

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.scheduledTime = this.context.currentTime + 0.1;
            this.scheduleNextBuffer();
        }
    }

    scheduleNextBuffer() {
        const SCHEDULE_AHEAD_TIME = 0.2;

        while (this.audioQueue.length > 0 && 
               this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME) {
            const audioData = this.audioQueue.shift();
            const audioBuffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
            audioBuffer.getChannelData(0).set(audioData);
            
            const source = this.context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.gainNode);
            
            const startTime = Math.max(this.scheduledTime, this.context.currentTime);
            source.start(startTime);
            
            this.scheduledTime = startTime + audioBuffer.duration;
        }

        if (this.audioQueue.length > 0 || !this.isStreamComplete) {
            this.checkInterval = setTimeout(() => this.scheduleNextBuffer(), 100);
        }
    }

    stop() {
        this.isPlaying = false;
        this.isStreamComplete = true;
        this.audioQueue = [];
        this.processingBuffer = new Float32Array(0);
        if (this.checkInterval) {
            clearTimeout(this.checkInterval);
        }
        this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
    }
}

export class SimpleAssistant {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.ws = null;
        this.audioContext = new AudioContext();
        this.audioStreamer = new AudioStreamer(this.audioContext);
        // Add stream storage
        this.screenStream = null;
        this.audioStream = null;
        this.audioProcessor = null;
        // Add monitoring properties
        this.lastMessageTime = Date.now();
        this.connectionMonitor = null;
        this.reconnectAttempts = 0;
        this.MAX_RECONNECT_ATTEMPTS = 3;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.videoElement = document.createElement('video');
        this.frameInterval = null;
        // Add scale factor
        this.videoScaleFactor = 0.25;
    }

    async connect() {
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
            console.log("Connected to Gemini API");
            this.reconnectAttempts = 0;
            this.startConnectionMonitoring();
            
            this.ws.send(JSON.stringify({
                setup: {
                    model: "models/gemini-2.0-flash-exp",
                    generationConfig: {
                        responseModalities: "audio",
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
                        }
                    },
                    systemInstruction: {
                        parts: [{
                            text: "You are an AI assistant integrated into a website chat interface. You can see the user's screen and hear their audio and their voice. Your responses will be converted to speech. Please help users with their questions and tasks while being friendly and professional. The site you are currently on is a video to SOAP note AI tool. If the user asks you how to create a video walk them through step by step: go to dashboard, enter patient name, enter date of service, click open camera, start recording, click stop recording. Wait patiently for your video to upload."

                        }]
                    }
                }
            }));
        };

        this.ws.onmessage = async (event) => {
            this.lastMessageTime = Date.now();
            if (event.data instanceof Blob) {
                const blob = event.data;
                const json = JSON.parse(await blob.text());
                console.log("Received blob:", json);

                if (json.serverContent?.modelTurn?.parts) {
                    const parts = json.serverContent.modelTurn.parts;
                    for (const part of parts) {
                        if (part.inlineData?.mimeType?.startsWith('audio/pcm')) {
                            this.audioStreamer.addPCM16(part.inlineData.data);
                        } else if (part.text) {
                            console.log("Assistant:", part.text);
                        }
                    }
                }
            } else {
                console.log("Received:", JSON.parse(event.data));
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.ws.onclose = async (event) => {
            console.log("WebSocket closed:", event.code, event.reason);
            if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
                console.log("Attempting to reconnect...");
                this.reconnectAttempts++;
                await this.connect();
            }
        };
    }

    startConnectionMonitoring() {
        // Clear any existing monitor
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
        }

        // Check connection health every 5 seconds
        this.connectionMonitor = setInterval(() => {
            const timeSinceLastMessage = Date.now() - this.lastMessageTime;
            
            // If no message received in 10 seconds, attempt reconnection
            if (timeSinceLastMessage > 10000) {
                console.log("Connection appears stale, attempting reconnect...");
                this.ws.close();
            }
            
            // Log stats to console for debugging
            console.log("Connection stats:", {
                timeSinceLastMessage: timeSinceLastMessage + "ms",
                wsState: this.ws.readyState,
                reconnectAttempts: this.reconnectAttempts
            });
        }, 5000);
    }

    async startCapture() {
        try {
            // Reduce video quality for better performance
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: { ideal: 15, max: 30 },
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 }
                },
                audio: false
            });

            // Setup video processing
            this.videoElement.srcObject = this.screenStream;
            await this.videoElement.play();
            
            // Set canvas size with scale factor
            this.canvas.width = this.videoElement.videoWidth * this.videoScaleFactor;
            this.canvas.height = this.videoElement.videoHeight * this.videoScaleFactor;

            // Slower frame rate (0.5 fps instead of 15 fps)
            this.frameInterval = setInterval(() => {
                this.captureAndSendFrame();
            }, 1000 / 0.5); // Send frame every 2 seconds

            // Get microphone with specific constraints
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 48000,
                    channelCount: 1
                }
            });

            // Setup audio processing
            const audioSource = this.audioContext.createMediaStreamSource(this.audioStream);
            const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            this.audioProcessor = processor;

            processor.onaudioprocess = (e) => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    const audioData = e.inputBuffer.getChannelData(0);
                    const pcmData = new Int16Array(audioData.length);
                    
                    for (let i = 0; i < audioData.length; i++) {
                        pcmData[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
                    }
                    
                    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
                    
                    this.ws.send(JSON.stringify({
                        realtimeInput: {
                            mediaChunks: [{
                                mimeType: "audio/pcm;rate=48000",
                                data: base64Audio
                            }]
                        }
                    }));
                }
            };

            audioSource.connect(processor);
            processor.connect(this.audioContext.destination);

            // Add track end listeners
            this.screenStream.getTracks().forEach(track => {
                track.onended = () => {
                    console.log('Screen track ended');
                    this.stop();
                };
            });

            this.audioStream.getTracks().forEach(track => {
                track.onended = () => {
                    console.log('Audio track ended');
                    this.stop();
                };
            });

            console.log("Started capturing screen and audio");

        } catch (error) {
            console.error("Error starting capture:", error);
            this.stop();
        }
    }

    captureAndSendFrame() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            try {
                // Draw current video frame to canvas at reduced size
                this.ctx.drawImage(
                    this.videoElement, 
                    0, 
                    0, 
                    this.canvas.width,
                    this.canvas.height
                );
                
                // Convert to JPEG and send with high quality
                this.canvas.toBlob((blob) => {
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64data = reader.result.split(',')[1];
                            this.ws.send(JSON.stringify({
                                realtimeInput: {
                                    mediaChunks: [{
                                        mimeType: "image/jpeg",
                                        data: base64data
                                    }]
                                }
                            }));
                        };
                        reader.readAsDataURL(blob);
                    }
                }, 'image/jpeg', 1.0); // Full JPEG quality
            } catch (error) {
                console.error('Error capturing frame:', error);
            }
        }
    }

    stop() {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
        }

        // Stop screen stream
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }

        // Stop audio stream
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }

        // Clean up audio processing
        if (this.audioProcessor) {
            this.audioProcessor.disconnect();
            this.audioProcessor = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        // Close websocket
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        }

        if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
        }

        this.audioStreamer.stop();
        console.log("Stopped all captures and connections");
    }
} 
