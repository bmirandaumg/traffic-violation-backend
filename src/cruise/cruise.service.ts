import { Injectable, ConflictException,NotFoundException } from '@nestjs/common';
import { CreateCruiseDto } from './dto/create-cruise.dto';
import { UpdateCruiseDto } from './dto/update-cruise.dto';
import { Repository } from 'typeorm';
import {Cruise } from './entities/cruise.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Photo } from 'src/photo/photo.entity';


 
@Injectable()
export class CruiseService {
  constructor(
    @InjectRepository(Cruise)
    private readonly cruiseRepository: Repository<Cruise>,
    @InjectRepository(Photo)
  private readonly photoRepository: Repository<Photo>, 
  ) {}
  create(createCruiseDto: CreateCruiseDto) {
    return this.cruiseRepository.save(createCruiseDto);
  }
  
   async findAll(): Promise<Cruise[]> {
    return this.cruiseRepository.find();
  }

  update(id: number, updateCruiseDto: UpdateCruiseDto) {
    return this.cruiseRepository.update(id, updateCruiseDto);
  }

  async remove(id: number) {
    const photoCount = await this.photoRepository.count({ where: { cruise: { id } } });
    if (photoCount > 0) {
      throw new ConflictException('No se puede eliminar porque existen fotos ligadas a este crucero.');
    }
    const deleteResult = await this.cruiseRepository.delete(id);
    if (!deleteResult.affected) {
      throw new NotFoundException(`Crucero ${id} no existe`);
    }
    return { message: 'Crucero eliminado' };
  }
}
