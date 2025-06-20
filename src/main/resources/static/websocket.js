class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.onMessage = null;
        this.onError = null;
        this.onClose = null;
        this.onOpen = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onmessage = (event) => {
            if (this.onMessage) {
                try {
                    const data = JSON.parse(event.data);
                    this.onMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    if (this.onError) {
                        this.onError(error);
                    }
                }
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (this.onError) {
                this.onError(error);
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket closed:', event);
            if (this.onClose) {
                this.onClose(event);
            }
            this.reconnect();
        };

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            if (this.onOpen) {
                this.onOpen();
            }
        };
    }

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
            setTimeout(() => this.connect(), 2000);
        }
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            if (data instanceof Blob) {
                this.socket.send(data);
            } else {
                this.socket.send(JSON.stringify(data));
            }
        } else {
            console.error('WebSocket is not connected');
        }
    }

    close() {
        if (this.socket) {
            this.socket.close();
        }
    }
}
