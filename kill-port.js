const { execSync } = require('child_process');

function killProcessOnPort(port) {
  console.log(`🔪 Eliminando processos na porta ${port}...\n`);

  try {
    // Para Windows, usamos netstat e taskkill
    const netstat = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });

    if (netstat.trim()) {
      const lines = netstat.trim().split('\n');

      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          try {
            console.log(`💥 Matando processo PID: ${pid}`);
            execSync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Processo ${pid} eliminado`);
          } catch (error) {
            console.log(`❌ Erro ao matar PID ${pid}: ${error.message}`);
          }
        }
      });
    } else {
      console.log(`📋 Nenhum processo encontrado na porta ${port}`);
    }

  } catch (error) {
    console.log(`❌ Erro ao verificar processos na porta ${port}: ${error.message}`);
  }

  // Esperar um pouco para liberar a porta
  console.log('\n⏳ Aguardando 3 segundos para liberar a porta...');
  execSync('timeout /t 3 /nobreak > nul');
}

function main() {
  console.log('🚀 KILL PORT PROCESS - LibreChat');
  console.log('='.repeat(50));

  // Matar processos na porta 3090
  killProcessOnPort(3090);

  // Também verificar porta 3080 para limpar possíveis conflitos
  killProcessOnPort(3080);

  console.log('\n✅ LIMPEZA CONCLUÍDA!');
  console.log('🟢 Portas 3080 e 3090 liberadas');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Execute: npm run backend:dev');
  console.log('2. Execute: npm run frontend:dev (em outro terminal)');
  console.log('3. Teste com: node login-debug.js');
}

main();
