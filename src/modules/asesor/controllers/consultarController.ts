import { Request, Response } from 'express';
import { ClienteService } from '../services/consultarService;

const clienteService = new ClienteService();

export class ClienteController {
  async buscarCliente(req: Request, res: Response) {
    try {
      const { numeroDocumento } = req.params;

      if (!numeroDocumento) {
        return res.status(400).json({ error: 'El número de documento es requerido' });
      }

      const resultado = await clienteService.buscarPorDocumento(numeroDocumento);

      if (!resultado.existe) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json(resultado.cliente);
    } catch (error) {
      console.error('Error en ClienteController.buscarCliente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
