import { Controller, Get, Patch, Param, Query, Req, UseGuards, BadRequestException, Post, Body } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('photos')
@UseGuards(JwtAuthGuard) 
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Get()
  async getPhotos(
    @Query('photo_date') photoDate: string,
    @Query('id_cruise') idCruise: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const idCruiseNumber = Number(idCruise);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    console.log({ photoDate, idCruiseNumber, pageNumber, limitNumber });

    if (isNaN(idCruiseNumber) || isNaN(pageNumber) || isNaN(limitNumber)) {
      throw new BadRequestException('Invalid query parameters');
    }

    return this.photoService.getFilteredPhotos(photoDate, idCruiseNumber, pageNumber, limitNumber);
  }
    @Post('reject')
  async rejectPhoto(
    @Body('photoId') photoId: number,
    @Body('userId') userId: number,
    @Body('rejectionReasonId') rejectionReasonId: number,
  ) {
    return this.photoService.rejectPhoto(photoId, userId, rejectionReasonId);
  }
  @Post('consultar-vehiculo')
async consultarVehiculo(@Body('placa') placa: string, @Body('tipo') tipo: string) {
  return this.photoService.consultarVehiculo(placa, tipo);
}
  
  @Patch(':id/take')
  async takePhoto(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.photoService.lockPhoto(id, userId);
  }

  @Patch(':id/release')
  async releasePhoto(@Param('id') id: number) {
    return this.photoService.unlockPhoto(id);
  }
}
