interface DireccionVista {
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  department: string;
}

export function TextoDireccion({ d }: { d: DireccionVista }) {
  return (
    <address className="direccion">
      <strong>{d.recipient}</strong>
      <span>{d.line1}</span>
      {d.line2 ? <span>{d.line2}</span> : null}
      <span>
        {d.city}, {d.department}
      </span>
      <span>{d.phone}</span>
    </address>
  );
}
