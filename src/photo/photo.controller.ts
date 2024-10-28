import { Controller, Get, Patch, Param, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
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

    if (isNaN(idCruiseNumber) || isNaN(pageNumber) || isNaN(limitNumber)) {
      throw new BadRequestException('Invalid query parameters');
    }

    return this.photoService.getFilteredPhotos(photoDate, idCruiseNumber, pageNumber, limitNumber);
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
