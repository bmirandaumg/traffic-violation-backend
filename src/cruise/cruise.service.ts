import { Injectable } from '@nestjs/common';
import { CreateCruiseDto } from './dto/create-cruise.dto';
import { UpdateCruiseDto } from './dto/update-cruise.dto';
import { Repository } from 'typeorm';
import {Cruise } from './entities/cruise.entity';
import { InjectRepository } from '@nestjs/typeorm';
 
@Injectable()
export class CruiseService {
  constructor(
    @InjectRepository(Cruise)
    private readonly cruiseRepository: Repository<Cruise>,
  ) {}
  create(createCruiseDto: CreateCruiseDto) {
    return 'This action adds a new cruise';
  }
  
   async findAll(): Promise<Cruise[]> {
    return this.cruiseRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} cruise`;
  }

  update(id: number, updateCruiseDto: UpdateCruiseDto) {
    return `This action updates a #${id} cruise`;
  }

  remove(id: number) {
    return `This action removes a #${id} cruise`;
  }
}
