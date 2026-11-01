import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  txtID?: string;

  @IsOptional()
  @IsString()
  txtPass?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  username?: string;
}

