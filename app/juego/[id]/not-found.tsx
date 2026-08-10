import Link from "next/link";

export default function GameNotFound() {
  return (
    <div className="av-404 fade-in">
      <div className="code flicker">404</div>
      <div className="msg">CARTUCHO NO ENCONTRADO</div>
      <p>Ese juego no está en el Vault. Puede que el cartucho se haya desmagnetizado.</p>
      <div className="detail-actions" style={{ justifyContent: "center" }}>
        <Link className="btn lg" href="/biblioteca">VOLVER AL VAULT</Link>
        <Link className="btn ghost lg" href="/">INICIO</Link>
      </div>
    </div>
  );
}
