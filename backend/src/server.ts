import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀 Serveur GSAB démarré sur http://localhost:${PORT}`);
  console.log(`📋 Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check  : http://localhost:${PORT}/api/health\n`);
});
