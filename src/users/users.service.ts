import { Injectable, ConflictException, BadRequestException , NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(username: string): Promise<User> {
    return this.userModel
      .findOne({ username })
      .populate({ path: 'createdEvents', select: 'name date location' })
      .populate({ path: 'attendedEvents', select: 'name date location' })
      .exec();
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.userModel.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check for existing username
    const existingUsername = await this.userModel.findOne({ 
      username: createUserDto.username 
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check for existing email
    const existingEmail = await this.userModel.findOne({ 
      email: createUserDto.email 
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return newUser.save();
  }

    async update(username: string, updateData: any): Promise<User> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and is unique
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await this.userModel.findOne({ 
        email: updateData.email,
        username: { $ne: username }
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateData.password) {
      // Hash the new password before saving
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashedPassword;
    }

       // Update user fields including location and about
       if (updateData.location) {
        user.location = updateData.location;
      }
      if (updateData.about) {
        user.about = updateData.about;
      }
      if (updateData.avatar) {
        user.avatar = updateData.avatar;
      }

    Object.assign(user, updateData);
    return user.save();
  }

  async follow(username: string, followerUsername: string): Promise<User> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.followers) {
      user.followers = [];
    }

    if (!user.followers.includes(followerUsername)) {
      user.followers.push(followerUsername);
      await user.save();

      // Add to following list of the follower
      const follower = await this.userModel.findOne({ username: followerUsername });
      if (follower) {
        if (!follower.following) {
          follower.following = [];
        }
        follower.following.push(username);
        await follower.save();
      }
    }

    return user;
  }

  async unfollow(username: string, followerUsername: string): Promise<User> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.followers) {
      user.followers = user.followers.filter(f => f !== followerUsername);
      await user.save();

      // Remove from following list of the follower
      const follower = await this.userModel.findOne({ username: followerUsername });
      if (follower && follower.following) {
        follower.following = follower.following.filter(f => f !== username);
        await follower.save();
      }
    }

    return user;
  }
}