import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    method: { type: String, required: true, uppercase: true, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    path: { type: String, required: true, trim: true },
    latencyMs: { type: Number, required: true, min: 0 },
    failureRate: { type: Number, required: true, min: 0, max: 100 },
    failureStatusCode: { type: Number, required: true, min: 100, max: 599 },
    successResponse: { type: mongoose.Schema.Types.Mixed, required: true },
    failureResponse: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

simulationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Simulation', simulationSchema);
