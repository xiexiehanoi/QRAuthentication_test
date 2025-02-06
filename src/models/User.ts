// models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  credentialID: string; // Base64-encoded string
  publicKey: string; // Base64-encoded string
  counter: number;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  credentialID: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, default: 0 },
}, { timestamps: true });

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
