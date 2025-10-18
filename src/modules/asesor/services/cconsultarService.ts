import pool from '../../../config/database';

export class ClienteService {
  async buscarPorDocumento(numeroDocumento: string) {
    const connection = await pool.getConnection();

    try {
      const [clientes]: any = await connection.query(
        `SELECT 
          id_cliente,
          tipo_documento,
          numero_documento,
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          nombre_completo,
          genero,
          fecha_nacimiento,
          nacionalidad,
          estado_civil,
          profesion,
          ocupacion,
          fecha_registro
        FROM clientes 
        WHERE numero_documento = ?`,
        [numeroDocumento]
      );

      if (clientes.length === 0) {
        return { existe: false, mensaje: 'Cliente no encontrado' };
      }

      const cliente = clientes[0];
      return { existe: true, cliente };
    } catch (error) {
      console.error('Error en ClienteService.buscarPorDocumento:', error);
      throw new Error('Error al consultar el cliente.');
    } finally {
      connection.release();
    }
  }
}
