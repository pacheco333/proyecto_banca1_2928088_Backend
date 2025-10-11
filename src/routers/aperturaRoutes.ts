import { Router } from 'express';
import { AperturaController } from '../controllers/aperturaController';

const router = Router();
const controller = new AperturaController();

router.post('/verificar-cliente', (req, res) => controller.verificarCliente(req, res));
router.post('/aperturar-cuenta', (req, res) => controller.aperturarCuenta(req, res));

export default router;
