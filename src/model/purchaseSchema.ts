import mongoose from 'mongoose';
import { IUser } from './userSchema';

export type TPurchase = {
  user: IUser;
  itemId: string;
  price: number;
  quantity: number;
  createdDate?: Date;
};

export interface IPurchase extends TPurchase, mongoose.Document {}

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  },
  itemId: {
    type: String,
    require: true,
  },
  price: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

const Purchase = mongoose.model<IPurchase>('purchase', purchaseSchema);

export default Purchase;
