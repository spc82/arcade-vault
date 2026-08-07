import Link from "next/link";

export default function Home() {
  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
        <div style={{ marginTop: 40 }}>
          <Link className="btn" href="/biblioteca">ENTRAR AL VAULT</Link>
        </div>
      </section>
    </div>
  );
}
