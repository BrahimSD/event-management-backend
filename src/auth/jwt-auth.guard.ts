import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers['authorization'];
    if (!authorizationHeader) {
      console.log('[JwtAuthGuard] No Authorization header found');
    } else {
      console.log('[JwtAuthGuard] Authorization header:', authorizationHeader);
      const token = authorizationHeader.split(' ')[1];
      console.log('[JwtAuthGuard] Extracted token:', token);
    }
    return super.canActivate(context);
  }
}