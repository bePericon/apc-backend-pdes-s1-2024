import mongoose from 'mongoose';
import { IRole } from './roleSchema';
import { IFavorite } from './favoriteSchema';

//Validation for mail.
var email_match = [
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  'Coloca un email válido',
];

export type TUser = {
  name: string;
  surname: string;
  username: string;
  password: string;
  email: string;
  createdDate?: Date;
  roles: IRole[];
  favorites: IFavorite[];
};

export interface IUser extends TUser, mongoose.Document {}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    maxlength: [30, 'Nombre muy largo'],
  },
  surname: {
    type: String,
    require: true,
    maxlength: [15, 'Apellido muy largo'],
  },
  username: {
    type: String,
    require: true,
    maxlength: [10, 'Username muy largo'],
  },
  password: {
    type: String,
    require: [true, 'Password is a required field'],
    minlength: [8, 'El password es my corto'],
  },
  email: {
    type: String,
    require: [true, 'Email is a required field'],
    match: email_match,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  roles: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'role',
    },
  ],
  favorites: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'favorite',
    },
  ],
});

const User = mongoose.model<IUser>('user', userSchema);

export default User;
