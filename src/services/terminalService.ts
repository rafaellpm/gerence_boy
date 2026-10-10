import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { api } from './api';

/** Retornos especiais de POST /Terminal (TDMNova.fSetTerminal no servidor). */
const LIMITE_ULTRAPASSADO = 9999;
const LIMITE_NAO_CONFIGURADO = 9998;

/** Tamanho máximo da coluna DS_IMEI (CAD_TERMINAL) no servidorGerencePlus. */
const TAMANHO_MAXIMO_SERIAL = 20;

/**
 * Registra este aparelho como terminal no servidorGerencePlus
 * (`POST /Terminal?terminal&modelo&serial`), como o app GerencePlus faz no
 * vínculo pelo QR Code — mas sem senha/código de liberação.
 *
 * O servidor identifica o aparelho pelo serial (Android ID): se já estiver
 * cadastrado devolve o mesmo código; se for novo, cadastra como ativo,
 * respeitando o limite de terminais ativos (QT_LIMITE_TERMINAL_MOBILE).
 * Exige `configurarApiBaseUrl` já aplicado.
 */
export async function registrarTerminal(cdTerminalAtual: number): Promise<number> {
  const modelo = DeviceInfo.getDeviceNameSync();
  const serial = (await DeviceInfo.getUniqueId()).toUpperCase();

  const resposta = await api.post('Terminal', null, {
    params: { terminal: cdTerminalAtual, modelo, serial },
  });
  const cdTerminal = Number(resposta.data) || 0;

  if (cdTerminal === LIMITE_ULTRAPASSADO) {
    throw new Error('Limite de terminais ultrapassado, favor inativar terminais que não estão em uso.');
  }
  if (cdTerminal === LIMITE_NAO_CONFIGURADO) {
    throw new Error('Limite de terminais não configurado no servidor.');
  }
  if (cdTerminal <= 0) {
    throw new Error('O servidor não retornou o código do terminal.');
  }
  return cdTerminal;
}

/** O QR Code de configuração traz só o IP do servidor; rejeita APIPA e loopback. */
export function validarIpQrCode(conteudo: string): string {
  const ip = conteudo.trim();
  if (!ip || ip.startsWith('169.254.') || ip === '127.0.0.1') {
    throw new Error('O servidor não está com um endereço de IP válido.');
  }
  return ip;
}
