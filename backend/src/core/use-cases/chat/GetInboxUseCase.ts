import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { QueryParams } from '../../../types/authTypes';
import { ValidationError } from '../../../utils/errors';
import logger from '../../../utils/logger';

export interface InboxResponse {
  _id: string;
  receiverId: string;
  senderName: string;
  subject?: string;
  createdAt: string;
  partnerProfilePicture?: string;
  latestMessage: {
    _id: string;
    message: string;
    createdAt: Date;
    isSender: boolean;
  } | null;
}

export class GetInboxUseCase {
  constructor(
    private chatRepository: IChatRepository,
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async execute(userId: string, role: 'patient' | 'doctor', params: QueryParams): Promise<InboxResponse[]> {
    logger.debug('GetInboxUseCase: entered', { userId, role });
    const inboxEntries = await this.chatRepository.getInbox(userId, params);

    // Remove duplicates by partnerId
    const uniqueEntries = Array.from(new Map(inboxEntries.map((entry) => [entry.partnerId, entry])).values());

    const inboxResponses: InboxResponse[] = await Promise.all(
      uniqueEntries.map(async (entry) => {
        const partnerId = entry.partnerId;
        let partnerName: string;
        let partnerProfilePicture: string | undefined;

        if (role === 'patient') {
          const doctor = await this.doctorRepository.findById(partnerId);
          if (!doctor) {
            throw new ValidationError(`Doctor with ID ${partnerId} not found`);
          }
          partnerName = doctor.name || 'Unknown Doctor';
          partnerProfilePicture = doctor.profilePicture;
        } else {
          const patient = await this.patientRepository.findById(partnerId);
          if (!patient) {
            throw new ValidationError(`Patient with ID ${partnerId} not found`);
          }
          partnerName = patient.name || 'Unknown Patient';
          partnerProfilePicture = patient.profilePicture;
        }

        return {
          _id: partnerId,
          receiverId: partnerId,
          senderName: partnerName,
          subject: 'Conversation',
          createdAt: entry.latestMessage?.createdAt?.toISOString() || new Date().toISOString(),
          partnerProfilePicture,
          latestMessage: entry.latestMessage
            ? {
                _id: entry.latestMessage._id!,
                message: entry.latestMessage.message,
                createdAt: entry.latestMessage.createdAt!,
                isSender: entry.latestMessage.senderId === userId,
              }
            : null,
        };
      })
    );

    logger.info('GetInboxUseCase: returning responses', { inboxResponses });
    return inboxResponses;
  }
}
