import { IdentityRepository } from '../repositories/identity.repository';
import { UserSecurityContext } from '../types/context';

export class IdentityService {
    static async getUsers(ctx: UserSecurityContext, limit: number, offset: number) {
        return IdentityRepository.getUsers(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getRoles(ctx: UserSecurityContext) {
        return IdentityRepository.getRoles(ctx.tenantId);
    }

    static async getPermissions() {
        return IdentityRepository.getPermissions();
    }
}
