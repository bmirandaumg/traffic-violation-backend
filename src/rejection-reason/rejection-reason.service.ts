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

  // Crear un nuevo motivo de rechazo
  async create(description: string): Promise<RejectionReason> {
    const rejectionReason = this.rejectionReasonRepository.create({ description });
    return this.rejectionReasonRepository.save(rejectionReason);
  }

  // Listar todos los motivos de rechazo
  async findAll(): Promise<RejectionReason[]> {
    return this.rejectionReasonRepository.find();
  }

  // Obtener un motivo de rechazo por ID
  async findById(id: number): Promise<RejectionReason> {
    const reason = await this.rejectionReasonRepository.findOne({ where: { id } });
    if (!reason) {
      throw new NotFoundException('Rejection reason not found');
    }
    return reason;
  }
}
