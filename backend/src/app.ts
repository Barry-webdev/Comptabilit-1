import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Routes
import authRoutes from './routes/auth.routes';
import elevesRoutes from './routes/eleves.routes';
import classesRoutes from './routes/classes.routes';
import anneesScolairesRoutes from './routes/anneesScolaires.routes';
import fraisRoutes from './routes/frais.routes';
import paiementsRoutes from './routes/paiements.routes';
import recusRoutes from './routes/recus.routes';
import recettesRoutes from './routes/recettes.routes';
import depensesRoutes from './routes/depenses.routes';
import dashboardRoutes from './routes/dashboard.routes';
import utilisateursRoutes from './routes/utilisateurs.routes';

const app = express();

// Middlewares globaux
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/eleves', elevesRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/annees-scolaires', anneesScolairesRoutes);
app.use('/api/frais', fraisRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/recus', recusRoutes);
app.use('/api/recettes', recettesRoutes);
app.use('/api/depenses', depensesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);

// Route de santé
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API GSAB opérationnelle' });
});

// Gestionnaire d'erreurs global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

export default app;
