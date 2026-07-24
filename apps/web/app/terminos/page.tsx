const SECCIONES = [
  {
    titulo: '1. Qué es TuRenta AI',
    texto:
      'TuRenta AI es una herramienta de autopreparación asistida de la declaración de renta de personas naturales en Colombia. La plataforma extrae información de los documentos que tú cargas, te hace preguntas y calcula un borrador ilustrativo del formulario 210 con instrucciones para que TÚ lo presentes ante la DIAN. No somos una firma de contadores ni sustituimos asesoría profesional.',
  },
  {
    titulo: '2. Tú eres el declarante',
    texto:
      'La declaración de renta la diligencias, firmas y presentas tú directamente en el portal MUISCA de la DIAN. Eres el único responsable ante la DIAN por el contenido de tu declaración, por la veracidad y completitud de la información que suministras a la plataforma, y por confirmar cada valor extraído de tus documentos antes de calcular.',
  },
  {
    titulo: '3. Obligaciones de medio, no de resultado',
    texto:
      'Nuestras obligaciones son de medio y no de resultado. Nos comprometemos a aplicar con diligencia la normativa tributaria vigente en nuestro motor de cálculo, validado con casos reales y pruebas automatizadas, pero el resultado depende de la información que tú aportes y confirmes.',
  },
  {
    titulo: '4. Garantía de exactitud (acotada)',
    texto:
      'Si la DIAN impone sanciones o intereses causados exclusivamente por un error de cálculo del software — entendido como un desacuerdo matemático entre el resultado del motor y la normativa vigente —, y verificado el error por nuestro equipo, asumiremos el valor de dichas sanciones o intereses. Esta garantía excluye: diferencias de interpretación normativa, información incompleta, inexacta o no confirmada por el usuario, valores extraídos por la IA que el usuario aprobó sin verificar contra su documento, y errores en la transcripción manual al portal de la DIAN. Condiciones: haber usado la plataforma con información completa y veraz, notificarnos cualquier requerimiento de la DIAN dentro de los 5 días hábiles siguientes y colaborar en la respuesta.',
  },
  {
    titulo: '5. Uso de inteligencia artificial',
    texto:
      'La plataforma usa modelos de IA para leer documentos, conversar contigo y explicar resultados. La IA NUNCA calcula tu impuesto: el cálculo lo hace un motor determinista auditado. Todos los valores extraídos por IA se te muestran para confirmación antes de usarse. Los documentos se procesan a través de proveedores de IA con políticas de no retención de datos.',
  },
  {
    titulo: '6. Cuentas y datos',
    texto:
      'Puedes usar la plataforma sin cuenta (tu avance vive solo en tu navegador) o crear una cuenta con tu correo para guardar tu avance. Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde la plataforma. El tratamiento de datos personales se rige por nuestra Política de Privacidad.',
  },
  {
    titulo: '7. Limitaciones',
    texto:
      'El alcance actual cubre residentes fiscales con rentas de trabajo y de capital (cédula general). No cubre aún: pensiones, dividendos, ganancias ocasionales, activos en el exterior ni obligados a llevar contabilidad. Si tu declaración requiere firma de contador público (art. 596 del E.T.) o tu caso excede el alcance, te lo indicaremos y deberás acudir a un profesional.',
  },
  {
    titulo: '8. Sin responsabilidad por actos de terceros',
    texto:
      'No respondemos por la disponibilidad del portal de la DIAN, sus tiempos de respuesta, devoluciones de saldos a favor, ni por interrupciones del servicio ajenas a nuestro control.',
  },
];

export default function PaginaTerminos() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <h1 className="text-3xl font-bold">Términos y Condiciones</h1>
      <p className="mt-1 text-sm text-texto-suave">TuRenta AI · Versión de trabajo · Julio de 2026</p>
      <p className="mt-4 rounded-xl bg-alerta-suave p-3 text-sm">
        ⚠️ Borrador para la beta: este texto debe ser revisado por un abogado antes del lanzamiento
        comercial.
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
