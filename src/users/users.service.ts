import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from '../services/cloudinary.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationsService: NotificationsService,
    private cloudinaryService: CloudinaryService
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel
      .find()
      .select('username email role avatar about location followers following')
      .exec();
  }

  async findOne(username: string): Promise<User> {
    return this.userModel
      .findOne({ username })
      .select(
        'username email role avatar about location followers following createdEvents attendedEvents',
      )
      .populate({ path: 'createdEvents', select: 'name date location' })
      .populate({ path: 'attendedEvents', select: 'name date location' })
      .exec();
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.userModel
      .findOne({
        $or: [{ email: identifier }, { username: identifier }],
      })
      .exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Vérifier si l'avatar est fourni en base64
      let avatarUrl = null;
      if (createUserDto.avatar && createUserDto.avatar.startsWith('data:')) {
        // Upload l'avatar sur Cloudinary
        avatarUrl = await this.cloudinaryService.uploadImage(createUserDto.avatar);
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
        avatar: avatarUrl // Utiliser l'URL Cloudinary
      });

      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        if (error.keyPattern.username) {
          throw new ConflictException('Username already exists');
        }
        if (error.keyPattern.email) {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async updateProfile(username: string, updateData: any): Promise<User> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      // Si une nouvelle image d'avatar est fournie en base64
      if (updateData.avatar && updateData.avatar.startsWith('data:')) {
        // Upload l'image sur Cloudinary
        updateData.avatar = await this.cloudinaryService.uploadImage(updateData.avatar);
      }

      // Mise à jour des autres champs
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      // Mettre à jour l'utilisateur
      await this.userModel.findOneAndUpdate(
        { username },
        {
          $set: {
            avatar: updateData.avatar,
            about: updateData.about,
            location: updateData.location,
            password: updateData.password || user.password
          }
        },
        { new: true }
      );

      // Retourner l'utilisateur mis à jour sans le mot de passe
      return this.userModel
        .findOne({ username })
        .select('-password')
        .exec();
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
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
        username: { $ne: username },
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
    const [user, follower] = await Promise.all([
      this.userModel.findOne({ username }),
      this.userModel.findOne({ username: followerUsername }),
    ]);

    if (!user || !follower) {
      throw new NotFoundException('User not found');
    }

    await Promise.all([
      this.userModel.updateOne(
        { username },
        { $addToSet: { followers: followerUsername } },
      ),
      this.userModel.updateOne(
        { username: followerUsername },
        { $addToSet: { following: username } },
      ),
    ]);
    // Créer une notification pour l'utilisateur suivi
    await this.notificationsService.createNotification({
      userId: username,
      message: `${followerUsername} started following you`,
      type: 'new_follower',
      data: { followerUsername },
    });

    return this.userModel
      .findOne({ username })
      .select('username email role avatar about location followers following')
      .exec();
  }

  async unfollow(username: string, followerUsername: string): Promise<User> {
    const [user, follower] = await Promise.all([
      this.userModel.findOne({ username }),
      this.userModel.findOne({ username: followerUsername }),
    ]);

    if (!user || !follower) {
      throw new NotFoundException('User not found');
    }

    await Promise.all([
      this.userModel.updateOne(
        { username },
        { $pull: { followers: followerUsername } },
      ),
      this.userModel.updateOne(
        { username: followerUsername },
        { $pull: { following: username } },
      ),
    ]);

    return this.userModel
      .findOne({ username })
      .select('username email role avatar about location followers following')
      .exec();
  }

  async toggleFollow(
    username: string,
    followerUsername: string,
    shouldFollow: boolean,
  ): Promise<User> {
    if (shouldFollow) {
      return this.follow(username, followerUsername);
    } else {
      return this.unfollow(username, followerUsername);
    }
  }
}
