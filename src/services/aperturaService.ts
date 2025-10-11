import pool from '../config/database';
import { VerificarClienteResponse, AperturarCuentaRequest, AperturarCuentaResponse } from '../models/interfaces';

export class AperturaService {

  // Verificar estado de solicitud del cliente
  async verificarCliente(tipoDocumento: string, numeroDocumento: string): Promise<VerificarClienteResponse> {
    const connection = await pool.getConnection();

    try {
      const [clientes]: any = await connection.query(
        'SELECT id_cliente, nombre_completo FROM clientes WHERE tipo_documento = ? AND numero_documento = ?',
        [tipoDocumento, numeroDocumento]
      );

      if (clientes.length === 0) {
        return {
          existe: false,
          estado: 'NoRegistrado',
          mensaje: 'El cliente no está registrado en el sistema. Debe registrarse primero con el asesor.'
        };
      }

      const cliente = clientes[0];

      // Verificar si ya tiene cuenta activa
      const [cuentas]: any = await connection.query(
        'SELECT COUNT(*) as total FROM cuentas_ahorro WHERE id_cliente = ? AND estado_cuenta = "Activa"',
        [cliente.id_cliente]
      );

      if (cuentas[0].total > 0) {
        return {
          existe: true,
          estado: 'YaTieneCuenta',
          mensaje: 'El cliente ya tiene una cuenta activa.',
          nombreCompleto: cliente.nombre_completo,
          idCliente: cliente.id_cliente
        };
      }

      // Buscar solicitud más reciente
      const [solicitudes]: any = await connection.query(
        'SELECT id_solicitud, estado, comentario_director FROM solicitudes_apertura WHERE id_cliente = ? ORDER BY fecha_solicitud DESC LIMIT 1',
        [cliente.id_cliente]
      );

      if (solicitudes.length === 0) {
        return {
          existe: true,
          estado: 'SinSolicitud',
          mensaje: 'No se encontró ninguna solicitud de apertura. Debe realizar una solicitud con el asesor.',
          icono: 'info', // ← También agregar ícono aquí
          nombreCompleto: cliente.nombre_completo,
          idCliente: cliente.id_cliente
        };
      }

      const solicitud = solicitudes[0];
      let mensaje = '';
      let icono = ''; // ← DECLARAR LA VARIABLE

      switch (solicitud.estado) {
        case 'Aprobada':
          mensaje = 'Solicitud APROBADA. Puede proceder con la apertura de cuenta.';
          icono = 'check_circle';
          break;
        case 'Rechazada':
          mensaje = `Solicitud RECHAZADA. ${solicitud.comentario_director || 'No se puede abrir la cuenta.'}`;
          icono = 'cancel';
          break;
        case 'Devuelta':
          mensaje = `Solicitud DEVUELTA. ${solicitud.comentario_director || 'Debe completar información adicional.'}`;
          icono = 'warning';
          break;
        case 'Pendiente':
          mensaje = 'Solicitud PENDIENTE de aprobación por el director. Por favor espere.';
          icono = 'schedule';
          break;
        default:
          mensaje = 'Estado de solicitud desconocido.';
          icono = 'help';
      }

      return {
        existe: true,
        estado: solicitud.estado,
        mensaje,
        icono, // ← Incluir en el return
        nombreCompleto: cliente.nombre_completo,
        idCliente: cliente.id_cliente,
        idSolicitud: solicitud.id_solicitud
      };


    } finally {
      connection.release();
    }
  }

  // Generar número de cuenta único
  private generarNumeroCuenta(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `2001${timestamp}${random}`.slice(0, 16);
  }

  // Aperturar cuenta de ahorro
  async aperturarCuenta(datos: AperturarCuentaRequest): Promise<AperturarCuentaResponse> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que la solicitud esté aprobada
      const [solicitudes]: any = await connection.query(
        'SELECT id_cliente, estado FROM solicitudes_apertura WHERE id_solicitud = ?',
        [datos.idSolicitud]
      );

      if (solicitudes.length === 0 || solicitudes[0].estado !== 'Aprobada') {
        await connection.rollback();
        return {
          exito: false,
          mensaje: 'La solicitud no está aprobada o no existe.'
        };
      }

      const idCliente = solicitudes[0].id_cliente;

      // Generar número de cuenta único
      let numeroCuenta = this.generarNumeroCuenta();

      // Verificar que sea único (por si acaso)
      let [existente]: any = await connection.query(
        'SELECT COUNT(*) as total FROM cuentas_ahorro WHERE numero_cuenta = ?',
        [numeroCuenta]
      );

      while (existente[0].total > 0) {
        numeroCuenta = this.generarNumeroCuenta();
        [existente] = await connection.query(
          'SELECT COUNT(*) as total FROM cuentas_ahorro WHERE numero_cuenta = ?',
          [numeroCuenta]
        );
      }

      // Crear cuenta
      const [resultCuenta]: any = await connection.query(
        'INSERT INTO cuentas_ahorro (numero_cuenta, id_cliente, id_solicitud, saldo) VALUES (?, ?, ?, ?)',
        [numeroCuenta, idCliente, datos.idSolicitud, datos.valorDeposito]
      );

      const idCuenta = resultCuenta.insertId;

      // Registrar transacción de apertura
      const [resultTransaccion]: any = await connection.query(
        `INSERT INTO transacciones (id_cuenta, tipo_transaccion, tipo_deposito, monto, codigo_cheque, numero_cheque, saldo_anterior, saldo_nuevo)
         VALUES (?, 'Apertura', ?, ?, ?, ?, 0, ?)`,
        [idCuenta, datos.tipoDeposito, datos.valorDeposito, datos.codigoCheque || null, datos.numeroCheque || null, datos.valorDeposito]
      );

      const idTransaccion = resultTransaccion.insertId;

      await connection.commit();

      return {
        exito: true,
        mensaje: 'Cuenta aperturada exitosamente.',
        numeroCuenta,
        idCuenta,
        idTransaccion
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error al aperturar cuenta:', error);
      return {
        exito: false,
        mensaje: 'Error al procesar la apertura. Intente nuevamente.'
      };
    } finally {
      connection.release();
    }
  }
}
