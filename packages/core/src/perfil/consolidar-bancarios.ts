import type { CertificadoBancarioExtraido } from '@turenta/shared';

import { coincideEntidad } from '../exogena/bancos-sin-certificado';


/**
 * Un banco entrega varios certificados del mismo año (saldos e intereses,
 * retención en la fuente) que repiten las mismas cifras: el de retención trae
 * como base los mismos rendimientos. Sumarlos duplicaría ingresos, así que por
 * entidad cada valor cuenta una vez (el mayor). Los bancos consolidan todas las
 * cuentas del cliente en un solo certificado de saldos.
 */
export function consolidarPorEntidad(certificados: CertificadoBancarioExtraido[]): CertificadoBancarioExtraido[] {
  return certificados.reduce<CertificadoBancarioExtraido[]>((grupos, cert) => {
    const indice = grupos.findIndex((g) => coincideEntidad(g.entidad, cert.entidad));
    if (indice < 0) {
      return [...grupos, cert];
    }
    return grupos.map((g, i) => (i === indice ? fusionar(g, cert) : g));
  }, []);
}

function fusionar(a: CertificadoBancarioExtraido, b: CertificadoBancarioExtraido): CertificadoBancarioExtraido {
  return {
    ...a,
    saldoCuentas: Math.max(a.saldoCuentas, b.saldoCuentas),
    rendimientos: Math.max(a.rendimientos, b.rendimientos),
    gmf: Math.max(a.gmf, b.gmf),
    retencionFuente: Math.max(a.retencionFuente, b.retencionFuente),
    componenteInflacionarioInformado: Math.max(a.componenteInflacionarioInformado, b.componenteInflacionarioInformado),
  };
}
