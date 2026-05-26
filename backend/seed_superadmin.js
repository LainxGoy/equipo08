const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function seedSuperAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'mall_db',
  });

  try {
    await client.connect();

    // Revisa si ya existe el superadmin
    const res = await client.query("SELECT * FROM users WHERE email = $1", ['admin@bolclick.app']);
    if (res.rows.length > 0) {
      console.log('El super admin ya existe: admin@bolclick.app');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', salt);
    const userId = crypto.randomUUID();

    // IMPORTANTE: insertamos con role = 'SUPER_ADMIN' y tenant_id = null
    await client.query(
      `INSERT INTO users (id, name, email, password, role, "isActive", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [userId, 'Mall Super Admin', 'admin@bolclick.app', hashedPassword, 'SUPER_ADMIN', true]
    );

    console.log('-------------------------------------------');
    console.log('SUPER ADMIN CREADO EXITOSAMENTE');
    console.log('Email: admin@bolclick.app');
    console.log('Contraseña: SuperAdmin123!');
    console.log('-------------------------------------------');

  } catch (err) {
    console.error('Error al crear super admin:', err);
  } finally {
    await client.end();
  }
}

seedSuperAdmin();
