$ErrorActionPreference = "Stop"

$ip = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceAlias -notlike "*Loopback*"
  } |
  Sort-Object InterfaceMetric |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
  Write-Host "Nao encontrei o IP da rede. Verifique se o Wi-Fi esta conectado." -ForegroundColor Red
  exit 1
}

Write-Host "Iniciando Expo Go no IP: $ip" -ForegroundColor Green
Write-Host "O QR Code deve aparecer como: exp://$ip`:8081" -ForegroundColor Yellow

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
npx expo start --lan --clear --port 8081
