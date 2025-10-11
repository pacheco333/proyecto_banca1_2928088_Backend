import express from 'express';
import cors from 'cors';
import aperturaRoutes from './routes/aperturaRoutes';

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/apertura', aperturaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Banca Uno - Sistema de Apertura de Cuentas' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: banca_uno`);
});
