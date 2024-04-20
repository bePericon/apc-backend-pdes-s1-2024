import mongoose from 'mongoose';
import { IPermission } from './permissionSchema';

export type TRole = {
  name: string;
  description?: string;
  createdDate?: Date;
  permissions: IPermission[]
};

export interface IRole extends TRole, mongoose.Document {}

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    permissions: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'permission',
      },
    ],
  }
);

const Role = mongoose.model<IRole>('role', roleSchema);

export default Role;
