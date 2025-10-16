
import * as fs from 'fs/promises';
import * as path from 'path';
import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, LessThanOrEqual } from 'typeorm';
import { Photo } from './photo.entity';
import { PhotoGateway } from './photo.gateway';
import { PhotoStatus } from './photo-status.entity';
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
  @InjectRepository(PhotoStatus)
  private readonly photoStatusRepository: Repository<PhotoStatus>,
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

    // Resolver ruta del archivo de forma robusta
    // - Si `photo_path` es absoluta, se usa tal cual
    // - Si es relativa, se antepone `IMAGES_BASE_DIR` (si existe) o `process.cwd()`
    // - Se normaliza para evitar segmentos redundantes
    const rawPath = (photo.photo_path || '').trim();
    const isUrl = /^https?:\/\//i.test(rawPath);
    if (!isUrl && rawPath) {
      const baseDir = process.env.IMAGES_BASE_DIR
        ? path.resolve(process.env.IMAGES_BASE_DIR)
        : process.cwd();

      const resolvedPath = path.isAbsolute(rawPath)
        ? path.normalize(rawPath)
        : path.normalize(path.join(baseDir, rawPath));

      console.log('[deletePhotoAndFile] Intentando eliminar archivo:', resolvedPath);
      try {
        // rm con force evita ENOENT si el archivo no existe
        await fs.rm(resolvedPath, { force: true });
        console.log('[deletePhotoAndFile] Archivo eliminado (o no existía):', resolvedPath);
      } catch (err) {
        // En la práctica, rm con force no lanza para ENOENT; si algo más falla, se registra el mensaje breve
        console.warn('[deletePhotoAndFile] Error al eliminar archivo:', resolvedPath, (err as any)?.message || err);
      }
    } else {
      if (!rawPath) {
        console.warn('[deletePhotoAndFile] photo_path vacío; no hay archivo que eliminar');
      } else {
        console.warn('[deletePhotoAndFile] photo_path parece ser una URL; omitiendo eliminación de archivo:', rawPath);
      }
    }

    // Eliminar la foto de la base de datos (siempre, aun si el archivo no existe)
    // await this.photoRepository.delete(photoId);
  }


  async getFilteredPhotos(
    photoDate: string,
    idCruise: number,
    page: number = 1,
    limit: number = 10,
    userId?: number,
  ): Promise<[any[], number]> {
    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;
  const oneHourAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos atrás

    // Mostrar fotos: libres o bloqueadas por el usuario actual
    const [photos, total] = await this.photoRepository.createQueryBuilder('photo')
      .where('photo.photo_date = :photoDate', { photoDate })
      .andWhere('photo.id_cruise = :idCruise', { idCruise })
      .andWhere('photo.id_photo_status = :status', { status: 0 })
      .andWhere('((photo.locked_by IS NULL AND (photo.locked_at IS NULL OR photo.locked_at <= :oneHourAgo)) OR (photo.locked_by = :userId))', { oneHourAgo, userId })
      .skip(skip)
      .take(limit)
      .orderBy('photo.id')
      .getManyAndCount();

    // Convertir cada foto a objeto con base64
    const result = [];
    for (const photo of photos) {
      let photo_base64 = null;
      const rawPath = (photo.photo_path || '').trim();
      const isUrl = /^https?:\/\//i.test(rawPath);
      if (!isUrl && rawPath) {
        const baseDir = process.env.IMAGES_BASE_DIR
          ? path.resolve(process.env.IMAGES_BASE_DIR)
          : process.cwd();
        const resolvedPath = path.isAbsolute(rawPath)
          ? path.normalize(rawPath)
          : path.normalize(path.join(baseDir, rawPath));
        console.log('[getFilteredPhotos] Intentando leer archivo:', resolvedPath);
        try {
          const buffer = await fs.readFile(resolvedPath);
          photo_base64 = buffer.toString('base64');
          console.log('[getFilteredPhotos] Imagen convertida a base64:', resolvedPath);
        } catch (err) {
          photo_base64 = null;
          console.warn('[getFilteredPhotos] No se pudo leer la imagen:', resolvedPath, (err as any)?.message || err);
        }
      } else {
        if (!rawPath) {
          console.warn('[getFilteredPhotos] photo_path vacío; no se puede leer imagen');
        } else {
          console.warn('[getFilteredPhotos] photo_path parece ser una URL; omitiendo lectura:', rawPath);
        }
      }

      // Buscar la descripción del status
      let photo_status = null;
      try {
        const status = await this.photoStatusRepository.findOne({ where: { id: photo.id_photo_status } });
        photo_status = status ? status.description : photo.id_photo_status;
      } catch (err) {
        photo_status = photo.id_photo_status;
      }

      result.push({
        id: photo.id,
        photo_date: photo.photo_date,
        photo_name: photo.photo_name,
        photo_status,
        id_cruise: photo.id_cruise,
        photo_base64,
      });
    }
    return [result, total];
  }

  async consultarVehiculo(pPlaca: string, pTipo: string): Promise<any> {
  const url = process.env.SOAP_URL_SAT;
  const pUsuario = process.env.SOAP_USER_SAT;
  const pClave = process.env.SOAP_PASS_SAT;
  pTipo = pTipo + '0';
  // if (pTipo.length === 1) {
  //   pTipo = pTipo + '0';
  // }
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
