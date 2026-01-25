const { poolPromise } = require('../config/config');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configurar el transportador de email
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'tu-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'tu-app-password'
    }
  });
};

// Generar código de verificación de 6 dígitos
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enviar código de verificación
exports.sendCode = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email es requerido' });
  }

  try {
    const pool = await poolPromise;
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    console.log('Generando código para:', email);
    console.log('Código generado:', code);

    // Crear transportador
    const transporter = createEmailTransporter();

    // Configurar el email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'tu-email@gmail.com',
      to: email,
      subject: 'Código de verificación - Store Management',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4A90E2; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Store Management</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; text-align: center;">Código de Verificación</h2>
            <p style="color: #666; font-size: 16px; text-align: center;">
              Tu código de verificación es:
            </p>
            <div style="background-color: #4A90E2; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 20px 0; border-radius: 8px; letter-spacing: 5px;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">
              Este código expira en 10 minutos.
            </p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Si no solicitaste este código, puedes ignorar este email.
            </p>
          </div>
        </div>
      `
    };

    // Enviar email
    await transporter.sendMail(mailOptions);
    console.log('Email enviado exitosamente a:', email);

    // Guardar o actualizar código en la base de datos
    try {
      // Primero verificar si ya existe un registro para este email
      const existingRecord = await pool.request()
        .input('Email', email)
        .query('SELECT * FROM [OLIVER SOLUTIONS S.A.S$VerificationCode] WHERE [Email] = @Email');

      if (existingRecord.recordset.length > 0) {
        // Actualizar código existente
        await pool.request()
          .input('Email', email)
          .input('Code', code)
          .input('ExpiresAt', expiresAt)
          .input('Used', 0)
          .query(`
            UPDATE [OLIVER SOLUTIONS S.A.S$VerificationCode] 
            SET [Code] = @Code, [ExpiresAt] = @ExpiresAt, [Used] = @Used, [CreatedAt] = GETDATE()
            WHERE [Email] = @Email
          `);
        console.log('Código actualizado en BD para:', email);
      } else {
        // Crear nuevo registro
        await pool.request()
          .input('Email', email)
          .input('Code', code)
          .input('ExpiresAt', expiresAt)
          .input('Used', 0)
          .query(`
            INSERT INTO [OLIVER SOLUTIONS S.A.S$VerificationCode] 
            ([Email], [Code], [ExpiresAt], [Used], [CreatedAt])
            VALUES (@Email, @Code, @ExpiresAt, @Used, GETDATE())
          `);
        console.log('Código guardado en BD para:', email);
      }
    } catch (dbError) {
      console.error('Error al guardar en BD:', dbError);
      // Continuar aunque falle la BD, el email ya se envió
    }

    res.json({ 
      message: 'Código de verificación enviado',
      email: email 
    });

  } catch (error) {
    console.error('Error enviando código:', error);
    res.status(500).json({ 
      message: 'Error al enviar código de verificación',
      error: error.message 
    });
  }
};

// Verificar código y autenticar/registrar usuario
exports.verifyCode = async (req, res) => {
  const { email, code, firstName, lastName } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ message: 'Email y código son requeridos' });
  }

  try {
    const pool = await poolPromise;

    // Verificar código en la base de datos
    const codeResult = await pool.request()
      .input('Email', email)
      .input('Code', code)
      .query(`
        SELECT * FROM [OLIVER SOLUTIONS S.A.S$VerificationCode] 
        WHERE [Email] = @Email AND [Code] = @Code AND [Used] = 0 AND [ExpiresAt] > GETDATE()
      `);

    if (codeResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    // Marcar código como usado
    await pool.request()
      .input('Email', email)
      .input('Code', code)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$VerificationCode] 
        SET [Used] = 1 
        WHERE [Email] = @Email AND [Code] = @Code
      `);

    // Verificar si el usuario ya existe
    const userResult = await pool.request()
      .input('Email', email)
      .query('SELECT * FROM [OLIVER SOLUTIONS S.A.S$User] WHERE [Email] = @Email');

    let user;
    if (userResult.recordset.length > 0) {
      // Usuario existente
      user = userResult.recordset[0];
      console.log('Usuario existente encontrado:', user.Email);
    } else {
      // Crear nuevo usuario
      if (!firstName || !lastName) {
        return res.status(400).json({ 
          message: 'Nombre y apellido son requeridos para nuevos usuarios' 
        });
      }

      // CORREGIDO: Omitir Status para usar el valor por defecto de la BD
      await pool.request()
        .input('Email', email)
        .input('FirstName', firstName)
        .input('LastName', lastName)
        .input('IsActive', 1)
        .query(`
          INSERT INTO [OLIVER SOLUTIONS S.A.S$User] 
          ([Email], [FirstName], [LastName], [IsActive], [CreatedAt])
          VALUES (@Email, @FirstName, @LastName, @IsActive, GETDATE())
        `);

      // Obtener el usuario recién creado
      const newUserResult = await pool.request()
        .input('Email', email)
        .query('SELECT * FROM [OLIVER SOLUTIONS S.A.S$User] WHERE [Email] = @Email');
      
      user = newUserResult.recordset[0];
      console.log('Nuevo usuario creado:', user.Email, 'con ID:', user.Id);
    }

    // Respuesta del usuario
    const userResponse = {
      id: user.Id,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      status: user.Status, // Esto tomará el valor por defecto de la BD
      isActive: user.IsActive
    };

    console.log('Login exitoso para:', userResponse.email);
    res.json({
      message: 'Autenticación exitosa',
      user: userResponse
    });

  } catch (error) {
    console.error('Error verificando código:', error);
    res.status(500).json({ 
      message: 'Error al verificar código',
      error: error.message 
    });
  }
};