export function formatarDataIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function dataIsoDeHoje(): string {
  return formatarDataIso(new Date());
}

export function dataHoraLocalIso(data: Date = new Date()): string {
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  const segundo = String(data.getSeconds()).padStart(2, '0');
  return `${formatarDataIso(data)}T${hora}:${minuto}:${segundo}`;
}

export function somarDias(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + dias);
  return formatarDataIso(data);
}

export function formatarDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarHoraExibicao(dataHoraIso: string): string {
  return dataHoraIso.split('T')[1]?.slice(0, 5) ?? '';
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
