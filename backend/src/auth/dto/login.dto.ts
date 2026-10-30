import { IsString, IsNotEmpty, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  txtID: string;

  @IsString()
  @IsNotEmpty()
  txtPass: string;
}

