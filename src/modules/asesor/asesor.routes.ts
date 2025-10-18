import { Router } from 'express';
import { ClienteController } from './controllers/consultarController';

const router = Router();
const clienteController = new ClienteController();

// ====== RUTAS DEL MÓDULO ASESOR ======
router.get('/cliente/:numeroDocumento', (req, res) =>
  clienteController.buscarCliente(req, res)
);

export default router;
