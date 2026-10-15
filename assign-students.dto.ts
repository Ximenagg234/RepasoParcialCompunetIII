import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignStudentsDto {

    @ApiProperty({
        example: ["4fcfc5ab-7902-478f-b173-b8f1e751af12"],
        description: "Ids (UUID) of the students to add to the program",
        type: [String]
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID("all", { each: true })
    studentIds: string[];
}
