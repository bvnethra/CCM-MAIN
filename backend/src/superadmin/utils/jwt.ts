import { jwtVerify, SignJWT } from 'jose';
import { UserSecurityContext } from '../types/context';

const DEFAULT_SECRET = 'super-secret-jwt-key-for-calibration-commercial-module-testing';

export async function verifyJwtToken(token: string, secretStr?: string): Promise<UserSecurityContext> {
    const secret = new TextEncoder().encode(secretStr || DEFAULT_SECRET);
    try {
        const { payload } = await jwtVerify(token, secret);
        
        return {
            userId: (payload.sub || payload.user_id || payload.userId) as string,
            tenantId: (payload.tenant_id || payload.tenantId) as string,
            organizationId: (payload.organization_id || payload.organizationId) as string,
            email: payload.email as string | undefined,
            roles: (payload.roles as string[]) || [],
            permissions: (payload.permissions as string[]) || []
        };
    } catch (err: any) {
        throw new Error('AUTH_INVALID_TOKEN: ' + (err.message || 'Invalid JWT token'));
    }
}

export async function generateTestJwtToken(context: UserSecurityContext, secretStr?: string): Promise<string> {
    const secret = new TextEncoder().encode(secretStr || DEFAULT_SECRET);
    return await new SignJWT({
        sub: context.userId,
        userId: context.userId,
        tenant_id: context.tenantId,
        organization_id: context.organizationId,
        email: context.email,
        roles: context.roles,
        permissions: context.permissions
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}
