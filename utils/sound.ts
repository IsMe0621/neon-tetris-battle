// Simple Web Audio API Synthesizer for SFX
// No external files required

class SoundManager {
    private ctx: AudioContext | null = null;
    private bgmOscillators: OscillatorNode[] = [];
    private masterGain: GainNode | null = null;
    public isMuted: boolean = false;

    constructor() {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.3; // Default volume
        } catch (e) {
            console.warn("Web Audio API not supported");
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
        if (!this.ctx || this.isMuted || !this.masterGain) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    public playSFX(type: 'move' | 'rotate' | 'drop' | 'clear' | 'gameover' | 'garbage') {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        switch (type) {
            case 'move':
                this.playTone(400, 'square', 0.05);
                break;
            case 'rotate':
                this.playTone(600, 'sine', 0.05);
                break;
            case 'drop':
                this.playTone(200, 'sawtooth', 0.1);
                break;
            case 'clear':
                this.playTone(800, 'sine', 0.1, 0);
                this.playTone(1200, 'sine', 0.1, 0.1);
                this.playTone(1600, 'square', 0.2, 0.2);
                break;
            case 'garbage':
                this.playTone(150, 'sawtooth', 0.3);
                this.playTone(100, 'sawtooth', 0.3, 0.1);
                break;
            case 'gameover':
                this.playTone(300, 'sawtooth', 0.5, 0);
                this.playTone(250, 'sawtooth', 0.5, 0.4);
                this.playTone(200, 'sawtooth', 1.0, 0.8);
                break;
        }
    }

    public playBGM() {
        // Placeholder for BGM. 
        // Real BGM with oscillators is complex. We'll just rely on SFX or 
        // assume an external <audio> element if the user provides one later.
        // For now, this method ensures AudioContext is resumed.
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if(this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
        }
        return this.isMuted;
    }
}

export const soundManager = new SoundManager();