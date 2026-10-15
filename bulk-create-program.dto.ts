import { ArrayNotEmpty, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { CreateProgramDto } from "./create-program.dto";

export class BulkCreateProgramDto {

    @ApiProperty({ description: "Programs to create", type: () => [CreateProgramDto] })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateProgramDto)
    programs: CreateProgramDto[];
}
