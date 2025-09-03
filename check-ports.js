const net = require('net');

async function checkPort(port) {
  return new Promise((resolve) => {
    const client = net.createConnection({ port }, () => {
      console.log(`✅ Porta ${port}: ABERTA`);
      client.destroy();
      resolve(true);
    });

    client.on('error', (error) => {
      console.log(`❌ Porta ${port}: FECHADA`);
      resolve(false);
    });

    client.setTimeout(2000, () => {
      console.log(`⏳ Porta ${port}: TIMEOUT`);
      client.destroy();
      resolve(false);
    });
  });
}

async function checkPorts() {
  console.log('🔍 VERIFICAÇÃO DE PORTAS - LibreChat');
  console.log('='.repeat(50));

  console.log('\n📊 PORTAS VERIFICADAS:');
  console.log('- 3080: Aplicação anterior (antiga)');
  console.log('- 3090: Aplicação atual (nova)\n');

  const port3080 = await checkPort(3080);
  const port3090 = await checkPort(3090);

  console.log('\n📋 ANÁLISE:');
  console.log('='.repeat(20));

  if (!port3080 && !port3090) {
    console.log('🚨 STATUS: AMBAS AS PORTAS ESTÃO FECHADAS');
    console.log('💡 NENHUMA aplicação está rodando!');
    console.log('\n🔧 SOLUÇÃO:');
    console.log('npm run backend:dev');
  } else if (port3080 && port3090) {
    console.log('⚠️ STATUS: AMBAS AS PORTAS ESTÃO ABERTAS');
    console.log('💡 Há conflito entre aplicações!');
    console.log('💡 A aplicação antiga (porta 3080) deve estar rodando simultaneamente');
    console.log('\n🔧 SOLUÇÕES:');
    console.log('1. Parar a aplicação na porta 3080');
    console.log('2. Ou continuar usando apenas porta 3090');
  } else if (port3080) {
    console.log('✅ STATUS: Apenas porta 3080 ativa (aplicação antiga)');
    console.log('💡 Você está usando a versão anterior');
  } else if (port3090) {
    console.log('✅ STATUS: Apenas porta 3090 ativa (aplicação atual)');
    console.log('💡 Você está usando a versão correta');
  }

  console.log('\n🔍 DIAGNÓSTICO DE CONFLITOS:');
  if (port3080 && port3090) {
    console.log('❌ CONFLITO DETECTADO!');
    console.log('💡 Duas aplicações rodando simultaneamente podem causar:');
    console.log('   - Conflitos de token JWT');
    console.log('   - Erros de autenticação');
    console.log('   - Cache desatualizado');
    console.log('   - Problemas de sessão');
  }
}

checkPorts();
