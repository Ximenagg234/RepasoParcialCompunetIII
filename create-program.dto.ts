import { IsInt, IsPositive, IsString, Matches, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProgramDto {

    @ApiProperty({ example: "Ingenieria de Sistemas", description: "Program's name (unique)", minLength: 3 })
    @IsString()
    @MinLength(3)
    name: string;

    @ApiProperty({ example: "SIS", description: "Program's code: 3 to 6 uppercase letters (unique)" })
    @IsString()
    @Matches(/^[A-Z]{3,6}$/, { message: "code must have between 3 and 6 uppercase letters" })
    code: string;

    @ApiProperty({ example: 160, description: "Program's credits", minimum: 1 })
    @IsInt()
    @IsPositive()
    credits: number;
}
