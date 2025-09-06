
import * as fs from 'fs/promises';
import * as path from 'path';
import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, LessThanOrEqual } from 'typeorm';
import { Photo } from './photo.entity';
import { ProcessedPhoto } from '../processed-photo/processed-photo.entity';
import { PhotoRejected } from '../processed-photo/photo-rejected.entity';
import { PhotoGateway } from './photo.gateway';
import { addHours } from 'date-fns';
import axios from 'axios';
import { buildSoapRequestSat } from 'src/utils/soap-templates';
import {parseStringPromise} from 'xml2js';


@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly photoGateway: PhotoGateway,  // Inyecta el gateway
    @InjectRepository(ProcessedPhoto)
    private readonly processedPhotoRepository: Repository<ProcessedPhoto>,
    @InjectRepository(PhotoRejected)
    private readonly photoRejectedRepository: Repository<PhotoRejected>,
  ) {}

  /**
   * Devuelve la foto por su ID
   */
  async getPhotoById(photoId: number): Promise<Photo | null> {
    return this.photoRepository.findOne({ where: { id: photoId } });
  }
  

  /**
   * Elimina la foto de la base de datos y borra el archivo físico usando photo_path
   */
  async deletePhotoAndFile(photoId: number): Promise<void> {
    // Buscar la foto por ID
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('Photo not found');


    // Construir la ruta absoluta al archivo
    const absolutePath = path.join(process.cwd(), photo.photo_path);
    try {
      await fs.unlink(absolutePath);
    } catch (err) {
      // Si el archivo no existe, solo loguea el error pero no detiene el proceso
      console.warn(`No se pudo eliminar el archivo: ${absolutePath}`, err);
    }

    // Eliminar la foto de la base de datos
    await this.photoRepository.delete(photoId);
  }

  async getFilteredPhotos(
    photoDate: string,
    idCruise: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Photo[], number]> {
    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;
    const oneHourAgo = addHours(new Date(), -1);

// Verificar los valores de entrada

return this.photoRepository.createQueryBuilder('photo')
  .where('photo.photo_date = :photoDate', { photoDate })
  .andWhere('photo.id_cruise = :idCruise', { idCruise })  // Filtro directo sobre id_cruise
  .andWhere('photo.id_photo_status = :status', { status: 0 }) 
  .andWhere('(photo.locked_by IS NULL AND (photo.locked_at IS NULL OR photo.locked_at <= :oneHourAgo))', { oneHourAgo })
  .skip(skip)
  .take(limit)
  .orderBy('photo.id')
  .getManyAndCount();
  }

  async rejectPhoto(photoId: number, userId: number, rejectionReasonId: number): Promise<void> {
    // 1. Cambiar el estatus de la foto en la tabla `photo`
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('Photo not found');
    
    photo.id_photo_status = 2;
    await this.photoRepository.save(photo);

    // 2. Insertar un registro en `processed_photo`
    const processedPhoto = this.processedPhotoRepository.create({
      photo: photo, // objeto completo
      user: { id: userId } as any, // solo el id, para evitar buscar el usuario completo
      start_time: photo.locked_at,
      end_time: new Date(),
      rejectionReason: { id: rejectionReasonId } as any // solo el id, para evitar buscar el motivo completo
    });
    const savedProcessedPhoto = await this.processedPhotoRepository.save(processedPhoto);

    // 3. Insertar un registro en `photo_rejected`
    const photoRejected = this.photoRejectedRepository.create({
      processedPhoto: savedProcessedPhoto,
      rejectionReason: { id: rejectionReasonId } as any,
    });
    await this.photoRejectedRepository.save(photoRejected);
  }

  async consultarVehiculo(pPlaca: string, pTipo: string): Promise<any> {
  const url = process.env.SOAP_URL_SAT;
  const pUsuario = process.env.SOAP_USER_SAT;
  const pClave = process.env.SOAP_PASS_SAT;

  const xml = buildSoapRequestSat(pUsuario, pClave, pTipo, pPlaca);

  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': '""',
  };

  const response = await axios.post(url, xml, { headers });
  const json = await parseStringPromise(response.data, { explicitArray: false });

  // 1. Extraer el XML interno
  const xmlInterno = json['soapenv:Envelope']
    ?.['soapenv:Body']
    ?.['ns1:datosGralesVehResponse']
    ?.datosGralesVehReturn
    ?._;

  if (!xmlInterno) {
    return { error: 'No se encontró la respuesta interna del SAT', raw: json };
  }

  // 2. Parsear el XML interno a JSON
  const datosVehiculo = await parseStringPromise(xmlInterno, { explicitArray: false });

  // 3. Devolver solo la parte útil y legible
  if (datosVehiculo.MSG_RESPUESTA?.DATOSGEN) {
    const datos = datosVehiculo.MSG_RESPUESTA.DATOSGEN;
    return {
      ESTADO: datos.ESTAD,
      PLACA: datos.PLACA,
      MARCA: datos.MARCA,
      LINEA: datos.LINEA,
      MODELO: datos.MODELO,
      COLOR: datos.COLOR,
      TIPO: datos.TIPO,
      USO: datos.USO,
      CC: datos.CC,
    };
  } else {
    return datosVehiculo.MSG_RESPUESTA;
  }
}

  async lockPhoto(photoId: number, userId: number): Promise<void> {
    await this.photoRepository.update(photoId, {
      locked_by: userId,
      locked_at: new Date(),
    });

    // Emite el evento para actualizar a los usuarios
    this.photoGateway.notifyPhotoLockUpdate(photoId, true);
  }

  async unlockPhoto(photoId: number): Promise<void> {
    await this.photoRepository.update(photoId, {
      locked_by: null,
      locked_at: null,
    });

    // Emite el evento para actualizar a los usuarios
    this.photoGateway.notifyPhotoLockUpdate(photoId, false);
  }
}
