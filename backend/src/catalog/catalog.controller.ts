import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Catalogo Publico')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get(':domain')
  @ApiOperation({
    summary: 'Obtener el catálogo público de una tienda por su dominio',
  })
  getCatalogByDomain(@Param('domain') domain: string) {
    return this.catalogService.getCatalogByDomain(domain);
  }
}
