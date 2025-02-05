// models/AttendanceSession.ts
import mongoose from 'mongoose';

const AttendanceSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.AttendanceSession ||
  mongoose.model('AttendanceSession', AttendanceSessionSchema);
