/**
 * WHEP (WebRTC-HTTP Egress Protocol) Client
 * Connects to a Cloudflare Stream WHEP endpoint for sub-second latency playback.
 *
 * Based on dashboard's proven implementation + Cloudflare WHEP spec.
 */

export class WHEPClient {
  private peerConnection: RTCPeerConnection | null = null;
  private endpoint: string;
  private videoElement: HTMLVideoElement;
  private resourceUrl: string | null = null;
  private remoteStream: MediaStream;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(endpoint: string, videoElement: HTMLVideoElement) {
    this.endpoint = endpoint;
    this.videoElement = videoElement;
    this.remoteStream = new MediaStream();
    this.connect();
  }

  private async connect(): Promise<void> {
    if (this.destroyed) return;

    try {
      // 1. Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
        bundlePolicy: 'max-bundle',
      });

      // 2. Add receive-only transceivers BEFORE creating offer
      this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
      this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });

      // 3. Collect remote tracks into a MediaStream
      this.remoteStream = new MediaStream();
      this.peerConnection.ontrack = (event) => {
        this.remoteStream.addTrack(event.track);
        // Attach stream to video element as tracks arrive
        if (this.videoElement.srcObject !== this.remoteStream) {
          this.videoElement.srcObject = this.remoteStream;
        }
      };

      // Monitor connection state for reconnection
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        if (state === 'failed' || state === 'disconnected') {
          this.handleDisconnect();
        }
        if (state === 'connected') {
          this.reconnectAttempts = 0;
        }
      };

      // 4. Create offer
      const offer = await this.peerConnection.createOffer();
      if (!this.peerConnection || this.destroyed) return;
      await this.peerConnection.setLocalDescription(offer);

      // 5. Wait for ICE gathering (max 3s)
      await this.waitForIceGathering(3000);
      if (!this.peerConnection || this.destroyed) return;

      const localDescription = this.peerConnection.localDescription;
      if (!localDescription) throw new Error('No local description');

      // 6. POST offer SDP to the WHEP URL (plain fetch, no credentials)
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: localDescription.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHEP negotiation failed: ${response.status} ${response.statusText}`);
      }

      // Store resource URL for teardown
      const location = response.headers.get('Location');
      if (location) {
        this.resourceUrl = new URL(location, this.endpoint).toString();
      }

      // 7. Set the answer
      const answerSdp = await response.text();
      if (!this.peerConnection || this.destroyed) return;
      await this.peerConnection.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      // 8. Attach to video element and play
      this.videoElement.srcObject = this.remoteStream;
      this.videoElement.muted = true; // autoplay requires muted
      await this.videoElement.play().catch(() => {});

    } catch (error) {
      console.error('[WHEPClient] Connection error:', error);
      this.handleDisconnect();
    }
  }

  private waitForIceGathering(timeout: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.peerConnection) { resolve(); return; }
      if (this.peerConnection.iceGatheringState === 'complete') { resolve(); return; }

      const timer = setTimeout(resolve, timeout);

      this.peerConnection.addEventListener('icegatheringstatechange', () => {
        if (this.peerConnection?.iceGatheringState === 'complete') {
          clearTimeout(timer);
          resolve();
        }
      });
    });
  }

  private handleDisconnect(): void {
    if (this.destroyed) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      console.log(`[WHEPClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      this.cleanupConnection();
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    } else {
      console.error('[WHEPClient] Max reconnection attempts reached');
    }
  }

  private cleanupConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'closed';
  }

  /**
   * Disconnect and clean up all resources
   */
  destroy(): void {
    this.destroyed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Send DELETE to WHEP resource URL to release server-side resources
    if (this.resourceUrl) {
      fetch(this.resourceUrl, { method: 'DELETE' }).catch(() => {});
      this.resourceUrl = null;
    }

    this.cleanupConnection();
    this.videoElement.srcObject = null;
  }
}

export default WHEPClient;
