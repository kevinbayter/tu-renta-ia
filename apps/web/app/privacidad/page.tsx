const SECCIONES = [
  {
    titulo: '1. Responsable del tratamiento',
    texto:
      'TuRenta AI (responsable del tratamiento) trata tus datos personales conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y las instrucciones de la Superintendencia de Industria y Comercio (SIC).',
  },
  {
    titulo: '2. Qué datos tratamos y para qué',
    texto:
      'Datos de identificación (nombre, cédula, correo), datos tributarios y financieros contenidos en los documentos que cargas (exógena, certificados de ingresos, bancarios, de salud) y las respuestas que das en la entrevista. Finalidad única: preparar el borrador de tu declaración de renta, guardar tu avance si creas cuenta, y contactarte sobre tu proceso. No vendemos ni compartimos tus datos con terceros para fines comerciales.',
  },
  {
    titulo: '3. Autorización',
    texto:
      'Al cargar documentos o crear una cuenta autorizas de manera previa, expresa e informada este tratamiento. Puedes revocar la autorización en cualquier momento eliminando tu cuenta.',
  },
  {
    titulo: '4. Procesamiento con IA y transmisión internacional',
    texto:
      'Para leer tus documentos usamos proveedores de modelos de IA ubicados fuera de Colombia, bajo contratos de transmisión de datos y políticas de no retención (tus documentos no se usan para entrenar modelos ni se almacenan por el proveedor). Este procesamiento en el exterior es necesario para prestar el servicio y está cubierto por tu autorización.',
  },
  {
    titulo: '5. Seguridad y retención',
    texto:
      'Tus datos viajan cifrados (TLS) y las sesiones usan cookies firmadas httpOnly. Guardamos tu información solo mientras tengas cuenta activa o mientras dure el proceso de tu declaración. Sin cuenta, tu avance vive únicamente en tu navegador.',
  },
  {
    titulo: '6. Tus derechos (habeas data)',
    texto:
      'Puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización. La supresión total está disponible directamente en la plataforma (eliminar cuenta) y borra tu usuario, documentos procesados y declaraciones de forma inmediata e irreversible. También puedes presentar quejas ante la SIC.',
  },
  {
    titulo: '7. Datos de menores y datos sensibles',
    texto:
      'La plataforma no está dirigida a menores de edad. Si reportas dependientes económicos, solo tratamos los datos mínimos necesarios para la deducción tributaria. No solicitamos datos sensibles (salud, biometría); los certificados de medicina prepagada se usan solo por su valor monetario.',
  },
];

export default function PaginaPrivacidad() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <h1 className="text-3xl font-bold">Política de Privacidad y Tratamiento de Datos</h1>
      <p className="mt-1 text-sm text-texto-suave">TuRenta AI · Ley 1581 de 2012 · Julio de 2026</p>
      <p className="mt-4 rounded-xl bg-alerta-suave p-3 text-sm">
        ⚠️ Borrador para la beta: este texto debe ser revisado por un abogado (incluido el estudio de
        impacto de privacidad de la Circular SIC 002 de 2024) antes del lanzamiento comercial.
      </p>
      {SECCIONES.map((s) => (
        <section key={s.titulo} className="mt-6">
          <h2 className="font-semibold">{s.titulo}</h2>
          <p className="mt-1 text-sm leading-relaxed text-texto-suave">{s.texto}</p>
        </section>
      ))}
    </main>
  );
}
