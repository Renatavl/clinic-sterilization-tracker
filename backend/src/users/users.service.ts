import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.ts';
import { CreateUserDto } from './dto/create-user.dto.ts';
import { AppException } from '../common/exceptions/app.exception.ts';
import * as bcrypt from 'bcrypt';
import { UserRole } from './enums/user-role.enum.ts';
import { UpdateUserDto } from './dto/update-user.dto.ts';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: {
        email: dto.email.trim().toLowerCase(),
      },
    });

    if (existingUser) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EMAIL_ALREADY_EXISTS',
        'User with this email already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const savedUser = await this.usersRepository.save({
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role ?? UserRole.STAFF,
    });

    const newUser = await this.usersRepository.findOne({
      where: {
        id: savedUser.id,
      },
    });

    return newUser;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'USER_NOT_FOUND',
        'User was not found',
      );
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLocaleLowerCase();

      const userWithEmailExists = await this.usersRepository.findOne({
        where: {
          email,
        },
      });

      if (userWithEmailExists && userWithEmailExists.id !== user.id) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'EMAIL_ALREADY_EXISTS',
          'User with this email already exists',
        );
      }

      user.email = email;
    }

    if (dto.password !== undefined) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await this.usersRepository.save(user);

    return this.findOne(user.id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.usersRepository.softDelete(id);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', {
        email,
      })
      .getOne();
  }
}
