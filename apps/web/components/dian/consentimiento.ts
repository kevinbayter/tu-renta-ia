'use client';

import { MINUTOS_VIGENCIA_AUTORIZACION } from '@turenta/core';
import { useEffect, useRef, useState } from 'react';

import { useDeclaracion } from '@/lib/store';

import type { ConsentimientoDian } from '@/lib/store';
import type { AlcanceAutorizacion } from '@turenta/core';

/** Una sola autorización cubre las dos descargas del wizard. */
const ALCANCES_WIZARD: AlcanceAutorizacion[] = ['leer_exogena', 'leer_declaraciones'];

export function alcancesPanel(recordar: boolean): AlcanceAutorizacion[] {
  return recordar ? [...ALCANCES_WIZARD, 'recordar_acceso'] : ALCANCES_WIZARD;
}

/** Con acceso guardado no se vuelve a pedir la contraseña: ya la tiene el worker. */
export function useAccesoGuardado(titular: string): boolean {
  const [guardado, setGuardado] = useState(false);
  useEffect(() => {
    consultarAccesos()
      .then((accesos) => setGuardado(accesos.includes(titular)))
      .catch(() => setGuardado(false));
  }, [titular]);
  return guardado;
}

async function consultarAccesos(): Promise<string[]> {
  const respuesta = await fetch('/api/dian/acceso');
  const cuerpo = (await respuesta.json()) as { accesos?: { titularIdentificacion: string }[] };
  return (cuerpo.accesos ?? []).map((a) => a.titularIdentificacion);
}

const MS_VIGENCIA_CONSENTIMIENTO = MINUTOS_VIGENCIA_AUTORIZACION * 60_000;

function consentimientoCubre(
  consentimiento: ConsentimientoDian | null,
  titular: string,
  alcance: AlcanceAutorizacion,
): consentimiento is ConsentimientoDian {
  return (
    consentimiento !== null &&
    consentimiento.titular === titular &&
    consentimiento.alcances.includes(alcance) &&
    Date.now() - consentimiento.otorgadoEn < MS_VIGENCIA_CONSENTIMIENTO
  );
}

export function useConsentimientoDian(titular: string, alcance: AlcanceAutorizacion) {
  const consentimiento = useDeclaracion((s) => s.consentimientoDian);
  const registrar = useDeclaracion((s) => s.registrarConsentimientoDian);
  const consentido = consentimientoCubre(consentimiento, titular, alcance);

  const alcancesEnEfecto = (mostrados: AlcanceAutorizacion[]): AlcanceAutorizacion[] => {
    const guardado = useDeclaracion.getState().consentimientoDian;
    return consentimientoCubre(guardado, titular, alcance) ? guardado.alcances : mostrados;
  };

  return { consentido, registrar, alcancesEnEfecto };
}

/** Conecta sola cuando no queda nada que preguntar; el ref evita bucles si falla. */
export function useConexionAutomatica(lista: boolean, conectar: () => void): void {
  const intento = useRef(false);
  useEffect(() => {
    if (lista && !intento.current) {
      intento.current = true;
      conectar();
    }
  }, [lista, conectar]);
}
