import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PredictionEnum {
  BENIGN = 'benign',
  MALWARE = 'malware',
  SPAM = 'spam',
  PHISHING = 'phishing',
}

export enum EventTypeEnum {
  QUERY = 'Query',
  RESPONSE = 'Response',
}

export interface IEventData extends Document {
  timestamp: Date;
  prediction: PredictionEnum;
  domain: string;
  event_type: EventTypeEnum;
  dns_domain_name_length: number;
  numerical_percentage: number;
  character_entropy: number;
  max_numeric_length: number;
  max_alphabet_length: number;
  vowels_consonant_ratio: number;
  receiving_bytes: number;
  sending_bytes: number;
  ttl_mean: number;
}

const EventDataSchema: Schema = new Schema({
  timestamp: { type: Date, required: true },
  prediction: { 
    type: String, 
    enum: Object.values(PredictionEnum), 
    required: true 
  },
  domain: { type: String, required: true },
  event_type: { 
    type: String, 
    enum: Object.values(EventTypeEnum), 
    required: true 
  },
  dns_domain_name_length: { type: Number, required: true },
  numerical_percentage: { type: Number, required: true },
  character_entropy: { type: Number, required: true },
  max_numeric_length: { type: Number, required: true },
  max_alphabet_length: { type: Number, required: true },
  vowels_consonant_ratio: { type: Number, required: true },
  receiving_bytes: { type: Number, required: true },
  sending_bytes: { type: Number, required: true },
  ttl_mean: { type: Number, required: true }
}, { timestamps: true });

export const EventData: Model<IEventData> = mongoose.model<IEventData>('EventData', EventDataSchema);

