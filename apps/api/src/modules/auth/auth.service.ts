import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../database/repositories/user.repository';
import { AuthMessage } from './dto/auth.message';
import { UserMessage } from './dto/user.message';
import type { RegisterForm } from './dto/register.form';
import type { LoginForm } from './dto/login.form';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) {}

  private sign(user: { id: string; username: string }): string {
    return this.jwt.sign({ sub: user.id, username: user.username });
  }

  async register(form: RegisterForm): Promise<AuthMessage> {
    const existing = await this.users.findByEmailOrUsername(
      form.email,
      form.username,
    );
    if (existing) {
      throw new ConflictException(
        existing.email === form.email
          ? 'อีเมลนี้ถูกใช้แล้ว'
          : 'username นี้ถูกใช้แล้ว',
      );
    }

    const password = await bcrypt.hash(form.password, 10);
    const user = await this.users.create({
      email: form.email,
      username: form.username,
      name: form.name,
      password,
    });

    return AuthMessage.from(this.sign(user), user);
  }

  async login(form: LoginForm): Promise<AuthMessage> {
    const user = await this.users.findByEmail(form.email);
    const ok = user && (await bcrypt.compare(form.password, user.password));
    if (!user || !ok) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    return AuthMessage.from(this.sign(user), user);
  }

  async me(userId: string): Promise<UserMessage> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return UserMessage.from(user);
  }
}
