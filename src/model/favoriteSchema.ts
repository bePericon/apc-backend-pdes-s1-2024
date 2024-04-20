import mongoose from 'mongoose';
import { IUser } from './userSchema';

export type TFavorite = {
  user: IUser;
  itemId: string;
  rating: number;
  comment: string;
  createdDate?: Date;
};

export interface IFavorite extends TFavorite, mongoose.Document {}

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  },
  itemId: {
    type: String,
    require: true,
  },
  rating: {
    type: Number,
  },
  comment: {
    type: String,
    maxlength: [500, 'Comentario muy largo'],
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

const Favorite = mongoose.model<IFavorite>('favorite', favoriteSchema);

export default Favorite;
