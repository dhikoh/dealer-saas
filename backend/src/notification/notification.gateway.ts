import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway for Real-Time Notifications
 * 
 * Workflow:
 * 1. Frontend connects with JWT token: io(url, { auth: { token } })
 * 2. Gateway verifies JWT and maps socket to userId room
 * 3. NotificationService calls sendToUser() after creating DB notification
 * 4. Connected client receives 'notification' event instantly
 * 5. Disconnection cleans up automatically via Socket.IO rooms
 */
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);

    constructor(private readonly jwtService: JwtService) { }

    /**
     * On client connection: verify JWT and join user-specific room
     */
    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.query?.token;

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token, disconnecting`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token as string);
            const userId = payload.sub || payload.userId;

            if (!userId) {
                this.logger.warn(`Client ${client.id} invalid token payload, disconnecting`);
                client.disconnect();
                return;
            }

            // Join user-specific room for targeted push
            client.join(`user:${userId}`);
            client.data.userId = userId;

            this.logger.log(`User ${userId} connected (socket: ${client.id})`);
        } catch (error) {
            this.logger.warn(`Client ${client.id} auth failed: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client ${client.id} disconnected (user: ${client.data?.userId || 'unknown'})`);
    }

    /**
     * Push notification to a specific user via their room.
     * Called by NotificationService after DB insert.
     */
    sendToUser(userId: string, notification: {
        id: string;
        title: string;
        message: string;
        type: string;
        link?: string;
        createdAt: Date;
    }) {
        this.server.to(`user:${userId}`).emit('notification', notification);
    }
}
