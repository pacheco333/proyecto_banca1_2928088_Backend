import { Router } from 'express';
import { AperturaController } from './controllers/aperturaController';
import { RetiroController } from './controllers/retiroController';
import { NotaDebitoController } from './controllers/notaDebitoController';

const router = Router();

// Controllers
const aperturaController = new AperturaController();
const retiroController = new RetiroController();
const notaDebitoController = new NotaDebitoController();

// ========== RUTAS DE APERTURA ==========
router.post('/apertura/verificar-cliente', (req, res) => 
  aperturaController.verificarCliente(req, res)
);
router.post('/apertura/aperturar-cuenta', (req, res) => 
  aperturaController.aperturarCuenta(req, res)
);

// ========== RUTAS DE RETIRO ==========
router.post('/retiro/buscar-cuenta', (req, res) => 
  retiroController.buscarCuenta(req, res)
);
router.post('/retiro/procesar-retiro', (req, res) => 
  retiroController.procesarRetiro(req, res)
);

// ========== RUTAS DE NOTA DÉBITO ==========
router.post('/nota-debito/aplicar-nota-debito', (req, res) => 
  notaDebitoController.aplicarNotaDebito(req, res)
);

export default router;
