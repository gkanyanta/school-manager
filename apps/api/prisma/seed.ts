import { PrismaClient, Role, Gender, TermName, DayOfWeek, StudentStatus, AttendanceStatus, AssessmentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  // ─── SUPER ADMIN ──────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@platform.local',
      passwordHash: hash(process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!'),
      firstName: 'Platform',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      schoolId: null,
    },
  });
  console.log('Super admin created:', superAdmin.email);

  // ─── DEMO SCHOOL ──────────────────────────────────
  const school = await prisma.school.upsert({
    where: { code: 'DEMO-SCH' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Lusaka Demo Primary School',
      code: 'DEMO-SCH',
      address: '123 Independence Avenue, Lusaka, Zambia',
      phone: '+260211123456',
      email: 'info@demodayschool.zm',
      motto: 'Excellence in Education',
    },
  });
  console.log('Demo school created:', school.name);

  // ─── SCHOOL USERS ─────────────────────────────────
  const schoolAdmin = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'admin@demodayschool.zm',
      passwordHash: hash('Password123!'),
      firstName: 'Jane',
      lastName: 'Mwila',
      phone: '+260977111111',
      role: Role.SCHOOL_ADMIN,
      schoolId: school.id,
    },
  });

  const headTeacher = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'head@demodayschool.zm',
      passwordHash: hash('Password123!'),
      firstName: 'Peter',
      lastName: 'Banda',
      phone: '+260977222222',
      role: Role.HEAD_TEACHER,
      schoolId: school.id,
    },
  });

  const bursar = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'bursar@demodayschool.zm',
      passwordHash: hash('Password123!'),
      firstName: 'Mary',
      lastName: 'Phiri',
      phone: '+260977333333',
      role: Role.BURSAR,
      schoolId: school.id,
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'teacher@demodayschool.zm',
      passwordHash: hash('Password123!'),
      firstName: 'John',
      lastName: 'Mumba',
      phone: '+260977444444',
      role: Role.TEACHER,
      schoolId: school.id,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000006' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000006',
      email: 'teacher2@demodayschool.zm',
      passwordHash: hash('Password123!'),
      firstName: 'Grace',
      lastName: 'Tembo',
      phone: '+260977555555',
      role: Role.TEACHER,
      schoolId: school.id,
    },
  });

  console.log('School users created');

  // ─── ACADEMIC YEAR & TERMS ────────────────────────
  const academicYear = await prisma.academicYear.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      name: '2026',
      startDate: new Date('2026-01-13'),
      endDate: new Date('2026-12-04'),
      isCurrent: true,
      schoolId: school.id,
    },
  });

  const term1 = await prisma.term.upsert({
    where: { id: '00000000-0000-0000-0000-000000000021' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000021',
      name: TermName.TERM_1,
      startDate: new Date('2026-01-13'),
      endDate: new Date('2026-04-10'),
      isCurrent: true,
      academicYearId: academicYear.id,
      schoolId: school.id,
    },
  });

  await prisma.term.upsert({
    where: { id: '00000000-0000-0000-0000-000000000022' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000022',
      name: TermName.TERM_2,
      startDate: new Date('2026-05-04'),
      endDate: new Date('2026-08-07'),
      isCurrent: false,
      academicYearId: academicYear.id,
      schoolId: school.id,
    },
  });

  await prisma.term.upsert({
    where: { id: '00000000-0000-0000-0000-000000000023' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000023',
      name: TermName.TERM_3,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-04'),
      isCurrent: false,
      academicYearId: academicYear.id,
      schoolId: school.id,
    },
  });

  console.log('Academic year and terms created');

  // ─── GRADES ───────────────────────────────────────
  const grades = [];
  for (let i = 1; i <= 7; i++) {
    const grade = await prisma.grade.upsert({
      where: { id: `00000000-0000-0000-0000-0000000000${30 + i}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-0000000000${30 + i}`,
        name: `Grade ${i}`,
        level: i,
        schoolId: school.id,
      },
    });
    grades.push(grade);
  }
  console.log('Grades created');

  // ─── CLASSES ──────────────────────────────────────
  const classesMap: Record<string, any> = {};
  for (const grade of grades) {
    for (const stream of ['A', 'B']) {
      const cls = await prisma.class.upsert({
        where: {
          name_gradeId_schoolId: { name: `${grade.name}${stream}`, gradeId: grade.id, schoolId: school.id },
        },
        update: {},
        create: {
          name: `${grade.name}${stream}`,
          gradeId: grade.id,
          schoolId: school.id,
          capacity: 40,
        },
      });
      classesMap[`${grade.level}-${stream}`] = cls;
    }
  }
  console.log('Classes created');

  // ─── SUBJECTS ─────────────────────────────────────
  const subjectDefs = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Creative Arts', code: 'ART' },
  ];

  const subjectsMap: Record<string, any> = {};
  for (const grade of grades) {
    for (const sub of subjectDefs) {
      const subject = await prisma.subject.upsert({
        where: {
          code_gradeId_schoolId: { code: sub.code, gradeId: grade.id, schoolId: school.id },
        },
        update: {},
        create: {
          name: sub.name,
          code: sub.code,
          gradeId: grade.id,
          schoolId: school.id,
        },
      });
      subjectsMap[`${grade.level}-${sub.code}`] = subject;
    }
  }
  console.log('Subjects created');

  // ─── TEACHER ASSIGNMENTS ──────────────────────────
  const g1a = classesMap['1-A'];
  const g1b = classesMap['1-B'];

  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_subjectId_schoolId: {
        teacherId: teacher1.id,
        classId: g1a.id,
        subjectId: subjectsMap['1-MATH'].id,
        schoolId: school.id,
      },
    },
    update: {},
    create: {
      teacherId: teacher1.id,
      classId: g1a.id,
      subjectId: subjectsMap['1-MATH'].id,
      isClassTeacher: true,
      schoolId: school.id,
    },
  });

  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_subjectId_schoolId: {
        teacherId: teacher1.id,
        classId: g1a.id,
        subjectId: subjectsMap['1-ENG'].id,
        schoolId: school.id,
      },
    },
    update: {},
    create: {
      teacherId: teacher1.id,
      classId: g1a.id,
      subjectId: subjectsMap['1-ENG'].id,
      schoolId: school.id,
    },
  });

  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_subjectId_schoolId: {
        teacherId: teacher2.id,
        classId: g1a.id,
        subjectId: subjectsMap['1-SCI'].id,
        schoolId: school.id,
      },
    },
    update: {},
    create: {
      teacherId: teacher2.id,
      classId: g1a.id,
      subjectId: subjectsMap['1-SCI'].id,
      schoolId: school.id,
    },
  });

  console.log('Teacher assignments created');

  // ─── STUDENTS & GUARDIANS ────────────────────────
  const studentNames = [
    { first: 'Chanda', last: 'Mulenga', gender: Gender.MALE },
    { first: 'Bupe', last: 'Nkandu', gender: Gender.FEMALE },
    { first: 'Mwamba', last: 'Chipimo', gender: Gender.MALE },
    { first: 'Natasha', last: 'Zulu', gender: Gender.FEMALE },
    { first: 'Daliso', last: 'Sakala', gender: Gender.MALE },
    { first: 'Thandiwe', last: 'Mbewe', gender: Gender.FEMALE },
    { first: 'Chimwemwe', last: 'Lungu', gender: Gender.MALE },
    { first: 'Kondwani', last: 'Daka', gender: Gender.MALE },
    { first: 'Mphatso', last: 'Tembo', gender: Gender.FEMALE },
    { first: 'Wezi', last: 'Banda', gender: Gender.FEMALE },
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const student = await prisma.student.upsert({
      where: {
        admissionNumber_schoolId: { admissionNumber: `DEMO-${String(i + 1).padStart(4, '0')}`, schoolId: school.id },
      },
      update: {},
      create: {
        firstName: s.first,
        lastName: s.last,
        gender: s.gender,
        dateOfBirth: new Date(`${2018 - (i % 3)}-${(i % 12) + 1}-${(i % 28) + 1}`),
        admissionNumber: `DEMO-${String(i + 1).padStart(4, '0')}`,
        admissionDate: new Date('2026-01-13'),
        classId: i < 5 ? g1a.id : g1b.id,
        schoolId: school.id,
        status: StudentStatus.ACTIVE,
      },
    });
    students.push(student);
  }
  console.log('Students created');

  // Parent user + guardian
  const parentUser = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000007' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000007',
      email: 'parent@demodayschool.zm',
      passwordHash: hash('Password123!'),
      firstName: 'Martha',
      lastName: 'Mulenga',
      phone: '+260977666666',
      role: Role.PARENT,
      schoolId: school.id,
    },
  });

  const guardian = await prisma.guardian.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      firstName: 'Martha',
      lastName: 'Mulenga',
      phone: '+260977666666',
      email: 'parent@demodayschool.zm',
      schoolId: school.id,
      userId: parentUser.id,
    },
  });

  // Link guardian to first two students
  for (let i = 0; i < 2; i++) {
    await prisma.studentGuardian.upsert({
      where: {
        studentId_guardianId: { studentId: students[i].id, guardianId: guardian.id },
      },
      update: {},
      create: {
        studentId: students[i].id,
        guardianId: guardian.id,
        relationship: 'Mother',
        isPrimary: true,
      },
    });
  }
  console.log('Parent and guardian links created');

  // ─── FEE STRUCTURES ──────────────────────────────
  for (const grade of grades) {
    await prisma.feeStructure.upsert({
      where: {
        gradeId_termId_schoolId: { gradeId: grade.id, termId: term1.id, schoolId: school.id },
      },
      update: {},
      create: {
        gradeId: grade.id,
        termId: term1.id,
        schoolId: school.id,
        items: {
          create: [
            { name: 'Tuition Fee', amount: 1500 },
            { name: 'Activity Fee', amount: 200 },
            { name: 'Exam Fee', amount: 100 },
            { name: 'Transport Fee', amount: 500, isOptional: true },
          ],
        },
      },
    });
  }
  console.log('Fee structures created');

  // ─── ANNOUNCEMENTS ────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: '00000000-0000-0000-0000-000000000050' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000050',
      title: 'Welcome to Term 1, 2026',
      content: 'Dear parents and students, welcome back to a new term. We look forward to a productive and exciting term ahead. Please ensure all fees are paid by the end of the first week.',
      target: 'SCHOOL',
      authorId: schoolAdmin.id,
      schoolId: school.id,
      isPublished: true,
    },
  });

  await prisma.announcement.upsert({
    where: { id: '00000000-0000-0000-0000-000000000051' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000051',
      title: 'Grade 1A Math Test Next Week',
      content: 'Please prepare for the mathematics test scheduled for next Monday. Topics: Addition and Subtraction of numbers 1-100.',
      target: 'CLASS',
      classId: g1a.id,
      authorId: teacher1.id,
      schoolId: school.id,
      isPublished: true,
    },
  });
  console.log('Announcements created');

  console.log('\n✓ Seed completed successfully!');
  console.log('\nDemo Accounts:');
  console.log('─────────────────────────────────────────');
  console.log('Super Admin:   admin@platform.local / ChangeMe123!');
  console.log('School Admin:  admin@demodayschool.zm / Password123!  (School: DEMO-SCH)');
  console.log('Head Teacher:  head@demodayschool.zm / Password123!   (School: DEMO-SCH)');
  console.log('Bursar:        bursar@demodayschool.zm / Password123! (School: DEMO-SCH)');
  console.log('Teacher:       teacher@demodayschool.zm / Password123! (School: DEMO-SCH)');
  console.log('Parent:        parent@demodayschool.zm / Password123! (School: DEMO-SCH)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
