
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            throw new UnauthorizedException('API Key is missing');
        }

        // Key format: prefix (16 chars) + random (48 chars)
        // We store the hash of the FULL key, but we can verify efficiently?
        // Actually, bcrypt verification is slow. 
        // Optimization: We stored `prefix` in DB. We can lookup by prefix first.

        // Check key format
        if (typeof apiKey !== 'string' || apiKey.length < 20) {
            throw new UnauthorizedException('Invalid API Key format');
        }

        const prefix = apiKey.substring(0, 16);

        // 1. Find key by prefix (fast lookup)
        const storedKey = await this.prisma.apiKey.findFirst({
            where: {
                prefix: prefix,
                active: true
            }
        });

        if (!storedKey) {
            throw new UnauthorizedException('Invalid API Key');
        }

        // 2. Verify full key hash
        const isMatch = await bcrypt.compare(apiKey, storedKey.keyHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid API Key');
        }

        // 3. Update last used (fire and forget to not block response time too much)
        this.prisma.apiKey.update({
            where: { id: storedKey.id },
            data: { lastUsed: new Date() }
        }).catch(err => console.error('Failed to update API key lastUsed', err));

        // Attach key info to request
        request.apiKey = storedKey;

        return true;
    }
}
