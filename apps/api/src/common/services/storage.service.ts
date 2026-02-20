import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

export interface StoredFile {
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class StorageService {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH || './uploads';
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async save(file: Express.Multer.File): Promise<StoredFile> {
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const dest = path.join(this.basePath, filename);

    fs.writeFileSync(dest, file.buffer);

    return {
      path: filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getFullPath(filePath: string): string {
    return path.join(this.basePath, filePath);
  }
}
