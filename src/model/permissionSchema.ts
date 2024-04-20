import mongoose from 'mongoose';

export type TPermission = {
  name: string;
  createdDate?: Date;
};

export interface IPermission extends TPermission, mongoose.Document {}

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
});

const Permission = mongoose.model<IPermission>('permission', permissionSchema);

export default Permission;
