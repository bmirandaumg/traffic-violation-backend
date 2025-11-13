import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RejectionReason } from './rejection-reason.entity';

@Injectable()
export class RejectionReasonService {
  constructor(
    @InjectRepository(RejectionReason)
    private readonly rejectionReasonRepository: Repository<RejectionReason>,
  ) {}

  // Add rejected reason
  async create(description: string): Promise<RejectionReason> {
    const rejectionReason = this.rejectionReasonRepository.create({ description });
    return this.rejectionReasonRepository.save(rejectionReason);
  }
  
  //delete rejected reason
    async delete(id: number): Promise<void> {
    const reason = await this.rejectionReasonRepository.findOne({ where: { id } });
    if (!reason) {
      throw new NotFoundException('Rejection reason not found');
    }
    await this.rejectionReasonRepository.remove(reason);
  }

  // List all rejected reasons
  async findAll(): Promise<RejectionReason[]> {
    return this.rejectionReasonRepository.find();
  }
}
