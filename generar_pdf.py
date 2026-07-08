#!/usr/bin/env python3
"""
Generador de PDF de Tendencias — línea de diseño ESFERA PLANNER.
Recibe un JSON de datos por stdin (o archivo) y escribe el PDF.
Mismo motor (weasyprint) y ADN visual que la skill esfera-guiones-pdf.

Uso:
    python3 generar_pdf.py datos.json salida.pdf
"""
import sys, json, base64, os, html as html_lib

ASSETS = os.path.dirname(__file__)
AZUL = "#3b6ef5"

PRIO = {
    "ALTA":  {"bg": "#e24b4a", "label": "PRIORIDAD ALTA"},
    "MEDIA": {"bg": "#f0a020", "label": "PRIORIDAD MEDIA"},
    "BAJA":  {"bg": "#7f8aa3", "label": "PRIORIDAD BAJA"},
}
NIVEL = {"Fácil": "#2bb673", "Facil": "#2bb673", "Medio": "#f0a020", "Alto": "#e24b4a"}
PLAT_COLOR = {
    "YouTube Shorts": "#e24b4a",
    "TikTok": "#111827",
    "Facebook/Instagram Reels": "#8b3dc9",
}


def esc(t):
    if t is None:
        return ""
    return html_lib.escape(str(t))


def logo_b64():
    try:
        with open(os.path.join(ASSETS, "escalando_logo.png"), "rb") as f:
            return base64.b64encode(f.read()).decode()
    except Exception:
        return ""


def tarjeta(t):
    prio = PRIO.get((t.get("prioridad") or "MEDIA").upper(), PRIO["MEDIA"])
    nivel_color = NIVEL.get(t.get("nivel_produccion"), "#7f8aa3")
    plat_color = PLAT_COLOR.get(t.get("plataforma"), AZUL)
    return f"""
  <div class="card" style="border-left-color:{plat_color}">
    <div class="card-top">
      <div class="card-title">{esc(t.get('titulo'))}</div>
      <div class="badges"><span class="badge" style="background:{prio['bg']}">{prio['label']}</span></div>
    </div>
    <div class="prio-line">{esc(t.get('metrica_dura',''))} — {esc(t.get('justificacion',''))}</div>
    <div class="chips">
      <span class="chip" style="border-color:{plat_color};color:{plat_color}">{esc(t.get('plataforma'))}</span>
      <span class="chip" style="border-color:{nivel_color};color:{nivel_color}">Producción {esc(t.get('nivel_produccion','—'))}</span>
      <span class="chip chip-3v">{esc(t.get('clasificacion_3v',''))}</span>
      <span class="chip chip-vig">{esc(t.get('vigencia',''))}</span>
    </div>
    <div class="row"><div class="lbl">DESCRIPCIÓN</div><div class="val">{esc(t.get('descripcion_visual'))}</div></div>
    <div class="row"><div class="lbl">POR QUÉ FUNCIONA</div><div class="val">{esc(t.get('por_que_funciona'))}</div></div>
    <div class="row"><div class="lbl">CLIENTE(S)</div><div class="val">{esc(t.get('clientes_recomendados'))}</div></div>
    <div class="row"><div class="lbl">CÓMO ADAPTAR</div><div class="val">{esc(t.get('como_adaptar'))}</div></div>
    <div class="row"><div class="lbl">VER VIDEO</div><div class="val"><a class="vlink" href="{esc(t.get('link'))}">{esc(t.get('link'))}</a></div></div>
  </div>"""


def seccion(n, idx):
    clientes = " · ".join(n.get("clientes", []))
    if n.get("sin_tendencias") or not n.get("tendencias"):
        return f"""
    <div class="nicho">
      <div class="nicho-head"><span class="nicho-num">{idx}</span><span class="nicho-title">{esc(n.get('nicho'))}</span></div>
      <div class="nicho-clientes">{esc(clientes)}</div>
      <div class="sin-tend">Sin tendencias relevantes este mes.</div>
    </div>"""
    cards = "".join(tarjeta(t) for t in n["tendencias"])
    return f"""
    <div class="nicho">
      <div class="nicho-head"><span class="nicho-num">{idx}</span><span class="nicho-title">{esc(n.get('nicho'))}</span></div>
      <div class="nicho-clientes">{esc(clientes)}</div>
      {cards}
    </div>"""


def build_html(d):
    logo = logo_b64()
    nichos = d["nichos"]
    total = sum(len(n.get("tendencias", [])) for n in nichos)
    activos = sum(1 for n in nichos if n.get("tendencias"))

    top5 = ""
    for i, t in enumerate(d.get("top5", [])):
        prio = PRIO.get((t.get("prioridad") or "MEDIA").upper(), PRIO["MEDIA"])
        top5 += f"""<div class="top-item">
          <span class="top-num">{i+1}</span>
          <div class="top-body">
            <div class="top-title">{esc(t.get('titulo'))}</div>
            <div class="top-meta"><span class="top-nicho">{esc(t.get('nicho'))}</span>
              <span class="top-badge" style="background:{prio['bg']}">{esc(t.get('prioridad'))}</span></div>
            <div class="top-razon">{esc(t.get('razon',''))}</div>
          </div></div>"""

    secciones = "".join(seccion(n, i + 1) for i, n in enumerate(nichos))
    logo_html = f'<div class="logo-box"><img src="data:image/png;base64,{logo}"></div>' if logo else ""

    return f"""<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><style>
@page {{ size:A4; margin:0; }}
@page content {{ margin:40px 46px 60px 46px;
  @bottom-center {{ content:"ESFERA · Tendencias · Escalando Marketing · Confidencial"; font-family:'Carlito'; font-size:7.5pt; color:#9aa3b2; }}
  @bottom-right {{ content:"Pág " counter(page); font-family:'Carlito'; font-size:7.5pt; color:#9aa3b2; }}
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family:'Carlito','DejaVu Sans',sans-serif; color:#1a2230; }}

.cover {{ page:cover; width:210mm; height:297mm; background:#0d1424; position:relative; overflow:hidden; }}
.cover-stripe {{ position:absolute; top:0; right:0; width:14px; height:100%; background:{AZUL}; }}
.cover-inner {{ position:absolute; top:46px; left:52px; right:66px; bottom:52px; background:#0f1830; border-radius:6px; padding:42px 46px; }}
.logo-box {{ width:124px; height:124px; background:#fff; border-radius:10px; padding:13px; display:flex; align-items:center; justify-content:center; }}
.logo-box img {{ max-width:100%; max-height:100%; }}
.kicker {{ margin-top:34px; font-family:'DejaVu Sans'; font-weight:bold; letter-spacing:6px; font-size:10.5pt; color:{AZUL}; text-transform:uppercase; }}
.cover h1 {{ font-family:'DejaVu Sans'; font-weight:bold; font-size:36pt; line-height:1.05; color:#fff; margin-top:10px; }}
.cover h1 .accent {{ color:{AZUL}; }}
.cover .sub {{ margin-top:14px; font-size:11.5pt; line-height:1.5; color:#aeb8cc; max-width:90%; }}
.cover-stats {{ margin-top:24px; display:flex; gap:48px; }}
.cstat .num {{ font-family:'DejaVu Sans'; font-weight:bold; font-size:24pt; color:{AZUL}; }}
.cstat .lbl {{ font-family:'DejaVu Sans'; letter-spacing:2px; font-size:7.5pt; color:#aeb8cc; text-transform:uppercase; margin-top:3px; }}
.top5 {{ margin-top:28px; }}
.top5-h {{ font-family:'DejaVu Sans'; font-weight:bold; font-size:10.5pt; color:#fff; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }}
.top-item {{ display:flex; gap:11px; margin-bottom:10px; align-items:flex-start; }}
.top-num {{ background:{AZUL}; color:#fff; font-family:'DejaVu Sans'; font-weight:bold; width:21px; height:21px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:9.5pt; flex-shrink:0; }}
.top-title {{ color:#eef2fb; font-size:9.5pt; font-weight:bold; line-height:1.3; font-family:'DejaVu Sans'; }}
.top-meta {{ margin:3px 0; }}
.top-nicho {{ color:#8b96ad; font-size:7.5pt; text-transform:uppercase; letter-spacing:1px; }}
.top-badge {{ color:#fff; font-size:6pt; font-weight:bold; padding:2px 7px; border-radius:4px; margin-left:8px; font-family:'DejaVu Sans'; }}
.top-razon {{ color:#9aa6bd; font-size:8pt; line-height:1.35; }}
.cover .foot {{ position:absolute; bottom:30px; left:98px; letter-spacing:3px; font-size:8pt; color:#7f8aa3; font-family:'DejaVu Sans'; }}

.content {{ page:content; }}
.nicho {{ margin-bottom:20px; }}
.nicho-head {{ display:flex; align-items:center; gap:11px; }}
.nicho-num {{ background:{AZUL}; color:#fff; font-family:'DejaVu Sans'; font-weight:bold; width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11pt; }}
.nicho-title {{ font-family:'DejaVu Sans'; font-weight:bold; font-size:14.5pt; color:#16202f; }}
.nicho-clientes {{ font-size:7.5pt; color:#7f8aa3; margin:3px 0 9px 35px; letter-spacing:.3px; }}
.sin-tend {{ margin-left:35px; font-size:9.5pt; color:#9aa3b2; font-style:italic; padding:6px 0; }}

.card {{ border:1px solid #e2e7f0; border-left:5px solid {AZUL}; border-radius:8px; padding:12px 16px 13px 16px; margin:0 0 11px 35px; break-inside:avoid; }}
.card-top {{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }}
.card-title {{ font-family:'DejaVu Sans'; font-weight:bold; font-size:12pt; color:#16202f; line-height:1.25; }}
.badges {{ text-align:right; flex-shrink:0; }}
.badge {{ display:inline-block; font-family:'DejaVu Sans'; font-weight:bold; font-size:6.5pt; letter-spacing:.4px; padding:3px 9px; border-radius:5px; color:#fff; white-space:nowrap; }}
.prio-line {{ font-size:8.5pt; color:#41506a; margin:6px 0 8px 0; line-height:1.4; background:#eef3ff; border-left:3px solid {AZUL}; padding:6px 10px; }}
.chips {{ margin:8px 0 9px 0; }}
.chip {{ display:inline-block; border:1px solid #d4dbe8; border-radius:5px; padding:2px 8px; margin:0 5px 4px 0; font-family:'DejaVu Sans'; font-weight:bold; font-size:6.5pt; color:#5a6a82; }}
.chip-3v {{ background:#f3f0ff; border-color:#c9bef0; color:#5a3ec8; }}
.chip-vig {{ background:#f7f9fc; }}
.row {{ margin:5px 0; display:table; width:100%; }}
.lbl {{ display:table-cell; font-family:'DejaVu Sans'; font-weight:bold; font-size:7pt; letter-spacing:.4px; color:{AZUL}; width:108px; vertical-align:top; padding-top:1px; }}
.val {{ display:table-cell; font-size:9pt; line-height:1.45; color:#33415b; vertical-align:top; }}
.vlink {{ color:{AZUL}; word-break:break-all; text-decoration:none; font-weight:bold; }}
</style></head><body>

<div class="cover">
  <div class="cover-stripe"></div>
  <div class="cover-inner">
    {logo_html}
    <div class="kicker">Esfera · Tendencias</div>
    <h1>Tendencias de<br>Contenido<br><span class="accent">{esc(d.get('mes'))} {esc(d.get('anio'))}</span></h1>
    <div class="sub">Detección mensual de formatos y ganchos que ya funcionan afuera, por nicho de la cartera. Insumo del Planificador de Contenidos.</div>
    <div class="cover-stats">
      <div class="cstat"><div class="num">{total}</div><div class="lbl">Tendencias</div></div>
      <div class="cstat"><div class="num">{activos}/12</div><div class="lbl">Nichos activos</div></div>
      <div class="cstat"><div class="num">3</div><div class="lbl">Plataformas</div></div>
    </div>
    <div class="top5">
      <div class="top5-h">&#9733; Top 5 del mes</div>
      {top5 or '<div style="color:#9aa6bd;font-size:9pt">Sin top del mes.</div>'}
    </div>
    <div class="foot">GENERADO {esc(d.get('fecha_generacion'))} &middot; ESCALANDO MARKETING DIGITAL</div>
  </div>
</div>

<div class="content">
  {secciones}
</div>
</body></html>"""


def main():
    if len(sys.argv) < 3:
        print("Uso: python3 generar_pdf.py datos.json salida.pdf")
        sys.exit(1)
    from weasyprint import HTML
    with open(sys.argv[1], encoding="utf-8") as f:
        datos = json.load(f)
    html = build_html(datos)
    HTML(string=html).write_pdf(sys.argv[2])
    print(f"PDF generado: {sys.argv[2]}")


if __name__ == "__main__":
    main()
