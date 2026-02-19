
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.RAILWAY_DATABASE_URL
        }
    }
});

async function createAdmin() {
    const email = 'admin@tecia.com.br';
    const password = '123';
    const name = 'Admin TecIA';

    console.log(`Creating user ${email}...`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                name,
                role: 'ADMIN',
                active: true
            },
            create: {
                email,
                password: hashedPassword,
                name,
                role: 'ADMIN',
                active: true,
                // Assuming other fields have defaults or are optional. 
                // If schema requires them, we might need to add them.
                // Based on previous schema knowledge, these should be enough or accessGroup might be needed if strictly required.
            }
        });

        console.log('✅ Admin user created/updated successfully:', user.email);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
