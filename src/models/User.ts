// models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface User extends Document {
  username: string;
  credentialID: string; // Base64-encoded string
  publicKey: string; // Base64-encoded string
  counter: number;
}

const UserSchema = new Schema<User>({
  username: { type: String, required: true, unique: true },
  credentialID: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, default: 0 },
}, { timestamps: true });

export default (mongoose.models.User as Model<User>) || mongoose.model<User>('User', UserSchema);
