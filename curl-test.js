const { execSync } = require('child_process');

// Teste básico de conectividade HTTP com curl
function testConnection(port) {
  try {
    console.log(`🔍 Testando porta ${port}...`);
    const output = execSync(`powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:${port}/health' -Method GET -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host 'OK' } else { Write-Host 'STATUS:' $response.StatusCode } } catch { Write-Host 'ERRO:' $_.Exception.Message }"`, { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    return 'ERRO: Curl falhou';
  }
}

// Teste de caminhos HTTP diferentes
function testPaths(port) {
  const paths = ['/health', '/api/auth/login', '/'];

  paths.forEach(path => {
    try {
      console.log(`\n🧪 Testando: http://localhost:${port}${path}`);
      const output = execSync(`powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:${port}${path}' -Method GET -TimeoutSec 3; Write-Host 'SUCCESS:' $response.StatusCode } catch { Write-Host 'ERROR:' $_.Exception.Message }"`, { encoding: 'utf8' });
      console.log(`   ${output.trim()}`);
    } catch (error) {
      console.log(`   ERRO: ${error.message}`);
    }
  });
}

function main() {
  console.log('🔧 TESTE DE CONECTIVIDADE HTTP');
  console.log('='.repeat(50));

  console.log('\n📊 ANÁLISE DE PORTAS');
  console.log('-'.repeat(30));

  // Testar portas possíveis
  const ports = [3080, 3090, 3091, 3000, 8000];

  for (const port of ports) {
    const result = testConnection(port);
    console.log(`Porta ${port}: ${result}`);

    if (result.includes('OK')) {
      console.log(`✅ Backend encontrado na porta ${port}!`);
      console.log('\n🔍 TESTANDO CAMINHOS:');
      testPaths(port);
      break;
    }
  }

  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Verifique em qual porta o backend realmente está rodando');
  console.log('2. Use url correta nos scripts de diagnóstico');
  console.log('3. Execute: node debug-backend.js --port=[porta correta]');
}

main();
