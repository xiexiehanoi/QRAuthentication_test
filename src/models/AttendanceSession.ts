// models/AttendanceSession.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAttendanceSession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default (mongoose.models.AttendanceSession as Model<IAttendanceSession>) ||
  mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema);
