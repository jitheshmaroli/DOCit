import mongoose, { Schema } from 'mongoose';
import { Speciality } from '../../../core/entities/Speciality';

const SpecialitySchema = new Schema<Speciality>({
  name: { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const SpecialityModel = mongoose.model('Speciality', SpecialitySchema);