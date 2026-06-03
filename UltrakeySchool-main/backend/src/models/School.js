import mongoose from 'mongoose';
import { institutionSchema } from './Institution.js';

// Register the 'School' model pointing to the exact same 'institutions' collection!
// This ensures that populate('institutionId') and mongoose.model('School') still work perfectly,
// but all operations are performed on the same collection as 'Institution'.
const School = mongoose.models.School || mongoose.model('School', institutionSchema, 'institutions');

export default School;
