// models/User.ts
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    // WebAuthn 등록 시 생성된 credentialID (base64 인코딩)
    credentialID: { type: String, required: true, unique: true },
    // 공개키 (base64 인코딩)
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
