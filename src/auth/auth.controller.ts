import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common'; // Add UnauthorizedException
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const payload = { 
      username: user.username, 
      sub: user._id, 
      role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
      role: user.role,
      avatar: user.avatar // Ajout de l'avatar dans la réponse
    };
  }

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const response = {
      access_token: this.jwtService.sign({
        username: user.username,
        sub: user._id,
        role: user.role
      }),
      username: user.username,
      role: user.role,
      avatar: user.avatar 
    };

    return response;
  }
}