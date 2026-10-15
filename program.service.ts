import { ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { BulkCreateProgramDto } from './dto/bulk-create-program.dto';
import { PaginationDto } from '../student/dto/pagination.dto';
import { Student } from '../student/entities/student.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ProgramService {

    private readonly logger = new Logger("ProgramService");

    constructor(
        @InjectRepository(Program)
        private readonly programRepository: Repository<Program>,
        private readonly datasource: DataSource
    ){}

    async create(createProgramDto: CreateProgramDto, user: User){
        try{
            const program = this.programRepository.create({
                ...createProgramDto,
                createdBy: user
            });
            await this.programRepository.save(program);
            return program;
        }catch(error){
            this.handleException(error);
        }
    }

    findAll(paginationDto: PaginationDto){
        const { limit, skip } = paginationDto;
        return this.programRepository.find({
            take: limit,
            skip: skip
        });
    }

    async findOne(id: string){
        const program = await this.programRepository.findOne({
            where: { id },
            relations: { students: true }
        });

        if(!program) throw new NotFoundException(`Program with id ${id} not found`);

        return program;
    }

    async assignStudents(id: string, assignStudentsDto: AssignStudentsDto){
        const studentIds = [...new Set(assignStudentsDto.studentIds)];

        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{
            const program = await queryRunner.manager.findOne(Program, {
                where: { id },
                relations: { students: true }
            });
            if(!program) throw new NotFoundException(`Program with id ${id} not found`);

            const students = await queryRunner.manager.findBy(Student, { id: In(studentIds) });
            if(students.length !== studentIds.length){
                const missing = studentIds.filter(studentId => !students.some(student => student.id === studentId));
                throw new NotFoundException(`Students with ids ${missing.join(", ")} not found`);
            }

            const currentStudents = program.students ?? [];
            const newStudents = students.filter(
                student => !currentStudents.some(current => current.id === student.id)
            );
            program.students = [...currentStudents, ...newStudents];

            await queryRunner.manager.save(program);
            await queryRunner.commitTransaction();
        }catch(error){
            await queryRunner.rollbackTransaction();
            this.handleException(error);
        }finally{
            await queryRunner.release();
        }

        return this.findOne(id);
    }

    async bulkCreate(bulkCreateProgramDto: BulkCreateProgramDto, user: User){
        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{
            const programs = bulkCreateProgramDto.programs.map(createProgramDto =>
                queryRunner.manager.create(Program, {
                    ...createProgramDto,
                    createdBy: user
                })
            );

            for(const program of programs){
                await queryRunner.manager.save(program);
            }

            await queryRunner.commitTransaction();
            return programs;
        }catch(error){
            await queryRunner.rollbackTransaction();
            this.handleException(error);
        }finally{
            await queryRunner.release();
        }
    }

    private handleException(error: any): never{
        if(error instanceof HttpException) throw error;

        if(error.code === '23505')
            throw new ConflictException(error.detail);

        this.logger.error(error);
        throw new InternalServerErrorException('Unexpected error, check server logs');
    }
}
