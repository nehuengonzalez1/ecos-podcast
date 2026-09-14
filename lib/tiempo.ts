/**
 * El texto del tiempo que falta para una fecha.
 *
 * Vive en un módulo neutro, sin 'use client', porque lo usan las dos mitades:
 * el servidor para el valor inicial del HTML y el contador del navegador para
 * refrescarlo. Que compartan la misma función es lo que garantiza que digan
 * exactamente lo mismo en el primer render; si cada lado tuviera la suya,
 * bastaría una diferencia de redondeo para que React avisara de una
 * discordancia entre el HTML y lo que dibuja el navegador.
 */
export function textoRestante(cierra: string, formato: 'corto' | 'largo' = 'largo'): string {
  const fin = new Date(cierra).getTime()
  if (Number.isNaN(fin)) return ''

  const falta = fin - Date.now()
  if (falta <= 0) return 'Sorteo finalizado'

  const minutos = Math.floor(falta / 60_000)
  const dias = Math.floor(minutos / 1440)
  const horas = Math.floor((minutos % 1440) / 60)
  const mins = minutos % 60

  if (formato === 'corto') {
    if (dias >= 1) return `${dias} ${dias === 1 ? 'día restante' : 'días restantes'}`
    if (horas >= 1) return `${horas} ${horas === 1 ? 'hora restante' : 'horas restantes'}`
    return `${mins} ${mins === 1 ? 'minuto restante' : 'minutos restantes'}`
  }

  // En la ficha se muestran las tres unidades, pero las de arriba se omiten
  // mientras estén en cero: "0 días 0 horas 12 min" se lee peor que "12 min".
  const partes: string[] = []
  if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`)
  if (dias > 0 || horas > 0) partes.push(`${horas} ${horas === 1 ? 'hora' : 'horas'}`)
  partes.push(`${mins} min`)
  return partes.join(' ')
}
