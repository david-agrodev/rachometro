import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Dribbble,
  Goal,
  HandCoins,
  Hourglass,
  Info,
  LandPlot,
  List,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Shuffle,
  Sparkles,
  Tag,
  Timer,
  Trash2,
  Trophy,
  UserPlus,
  Volleyball,
  Star,
  X
} from "lucide-react";

const APP_NAME = "RachôMetro";
const logoUrl = "/rachometro-logo.png";

const CAB_GOLS = ["GOLEIRO", "GOLEIROS", "GOL", "GOLEIRA", "GOLEIRAO"];
const CAB_JOGS = [
  "ATLETAS",
  "ATLETA",
  "JOGADORES",
  "JOGADOR",
  "LINHA",
  "ATLETAS DE ALTO NIVEL",
  "ATLETAS DE ALTO NÍVEL"
];
const CAB_ESPERA = ["LISTA DE ESPERA", "ESPERA", "RESERVA", "SUPLENTE"];
const CAB_SEPARAR = ["SEPARAR", "SEPARAR CRAQUES", "NAO JUNTAR", "EVITAR JUNTOS"];
const MODALIDADES = [
  { value: "futsal", label: "FUTSAL", jogadores: 5, icon: Goal },
  { value: "society", label: "SOCIETY", jogadores: 6, icon: Dribbble },
  { value: "campo", label: "CAMPO", jogadores: 11, icon: LandPlot },
  { value: "volei", label: "VOLEI", jogadores: 6, icon: Volleyball }
];
const EMOJIS_MODALIDADE = {
  futsal: "⚽",
  society: "🏟️",
  campo: "🌱",
  volei: "🏐"
};
const TIMES_MODELO = 3;

function routeFromHash() {
  return window.location.hash === "#/placar" ? "placar" : "sorteio";
}

function navigateTo(route) {
  window.location.hash = route === "placar" ? "#/placar" : "#/";
}

function linhasNumeradas(total) {
  return Array.from({ length: total }, (_, index) => `${index + 1}.`).join("\n");
}

function montarModeloLista(modalidadeAtual, jogadoresPorTimeAtual, info = {}) {
  const config = MODALIDADES.find(item => item.value === modalidadeAtual) || MODALIDADES[0];
  const porTime = Math.max(1, Number(jogadoresPorTimeAtual) || config.jogadores);
  const emoji = EMOJIS_MODALIDADE[modalidadeAtual] || "⚽";
  const usaGoleiro = modalidadeAtual !== "volei";
  const totalGoleiros = usaGoleiro ? TIMES_MODELO : 0;
  const linhaPorTime = usaGoleiro ? Math.max(1, porTime - 1) : porTime;
  const totalLinha = linhaPorTime * TIMES_MODELO;

  let texto = `✅ LISTA DOS CONFIRMADOS - ${config.label}\n`;
  texto += `${emoji} ${info.quadra?.trim() || "Racha confirmado"}\n`;
  if (info.dataHora?.trim()) texto += `🗓️ Quando: ${info.dataHora.trim()}\n`;
  if (info.endereco?.trim()) texto += `📍 Endereço: ${info.endereco.trim()}\n`;
  if (info.valor?.trim()) texto += `💰 Valor: ${info.valor.trim()}\n`;
  if (info.pix?.trim()) texto += `🔑 Pix: ${info.pix.trim()}\n`;
  if (info.observacoes?.trim()) texto += `📝 Obs: ${info.observacoes.trim()}\n`;
  texto += "\n";

  if (usaGoleiro) {
    texto += "🧤 GOLEIROS\n";
    texto += `${linhasNumeradas(totalGoleiros)}\n\n`;
  }

  texto += `${usaGoleiro ? "🏃" : "🏐"} ATLETAS\n`;
  texto += `${linhasNumeradas(totalLinha)}\n\n`;
  texto += "⏳ LISTA DE ESPERA\n1.\n2.";

  return texto;
}

function normalizarCabecalho(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .toUpperCase();
}

function contemCabecalho(linhaNormalizada, listaChaves) {
  return listaChaves.some(chave => linhaNormalizada.includes(normalizarCabecalho(chave)));
}

function limparLinha(linha) {
  return linha
    .replace(/[✅⚽🧤🏆🔥⭐🌟🔹▪️▫️■□▣▢]/g, "")
    .replace(/[\uFE0F\u20E3]/g, "")
    .replace(/^[\s\d.)\]-]+/, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/^\d+\s*[-–—.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarNomeJogador(nome) {
  return nome
    .replace(/\s*\(GOL\)/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function identificarNomesDuplicados(nomes) {
  const vistos = new Set();
  const repetidos = new Set();
  for (const nome of nomes) {
    const chave = normalizarNomeJogador(nome).replace(/\s+/g, " ");
    if (!chave) continue;
    if (vistos.has(chave)) repetidos.add(nome.trim());
    else vistos.add(chave);
  }
  return [...repetidos];
}

function avisarNomesDuplicados(nomes) {
  const duplicados = identificarNomesDuplicados(nomes);
  if (!duplicados.length) return false;

  const anterior = document.getElementById("rachometro-duplicados-overlay");
  if (anterior) anterior.remove();

  const overlay = document.createElement("div");
  overlay.id = "rachometro-duplicados-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "99999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "20px";
  overlay.style.background = "rgba(3, 10, 8, 0.82)";
  overlay.style.backdropFilter = "blur(6px)";

  const card = document.createElement("div");
  card.style.width = "100%";
  card.style.maxWidth = "520px";
  card.style.borderRadius = "24px";
  card.style.padding = "24px";
  card.style.color = "#f3fff8";
  card.style.background = "linear-gradient(180deg, #0b211c 0%, #071612 100%)";
  card.style.border = "1px solid rgba(64, 214, 137, 0.35)";
  card.style.boxShadow = "0 24px 60px rgba(0, 0, 0, 0.45)";
  card.style.fontFamily = "Inter, system-ui, sans-serif";

  const badge = document.createElement("div");
  badge.textContent = "RACHÔMETRO";
  badge.style.display = "inline-flex";
  badge.style.marginBottom = "10px";
  badge.style.padding = "6px 10px";
  badge.style.borderRadius = "999px";
  badge.style.fontSize = "12px";
  badge.style.fontWeight = "800";
  badge.style.letterSpacing = "0.08em";
  badge.style.color = "#67f0a8";
  badge.style.background = "rgba(29, 87, 63, 0.45)";
  badge.style.border = "1px solid rgba(64, 214, 137, 0.22)";

  const title = document.createElement("h3");
  title.textContent = "Nomes duplicados encontrados";
  title.style.margin = "0 0 10px";
  title.style.fontSize = "26px";
  title.style.lineHeight = "1.1";

  const intro = document.createElement("p");
  intro.textContent = "Para evitar erros com craques, atrasados e sorteio, diferencie estes nomes antes de continuar:";
  intro.style.margin = "0 0 18px";
  intro.style.fontSize = "15px";
  intro.style.lineHeight = "1.55";
  intro.style.color = "rgba(236, 255, 244, 0.88)";

  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexWrap = "wrap";
  list.style.gap = "10px";
  list.style.marginBottom = "18px";

  duplicados.forEach((nome) => {
    const item = document.createElement("span");
    item.textContent = nome;
    item.style.display = "inline-flex";
    item.style.alignItems = "center";
    item.style.padding = "10px 14px";
    item.style.borderRadius = "14px";
    item.style.fontWeight = "700";
    item.style.color = "#eafff2";
    item.style.background = "rgba(13, 62, 44, 0.92)";
    item.style.border = "1px solid rgba(64, 214, 137, 0.28)";
    list.appendChild(item);
  });

  const hint = document.createElement("div");
  hint.textContent = "Exemplo: Gabriel Silva e Gabriel Souza.";
  hint.style.marginBottom = "22px";
  hint.style.padding = "12px 14px";
  hint.style.borderRadius = "14px";
  hint.style.fontSize = "14px";
  hint.style.color = "#bfffd7";
  hint.style.background = "rgba(17, 53, 40, 0.88)";
  hint.style.border = "1px solid rgba(64, 214, 137, 0.15)";

  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.justifyContent = "flex-end";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Entendi";
  button.style.border = "none";
  button.style.borderRadius = "14px";
  button.style.padding = "12px 18px";
  button.style.fontSize = "15px";
  button.style.fontWeight = "800";
  button.style.cursor = "pointer";
  button.style.color = "#062015";
  button.style.background = "linear-gradient(180deg, #6cf2aa 0%, #2cd37b 100%)";
  button.style.boxShadow = "0 12px 26px rgba(44, 211, 123, 0.28)";

  const fechar = () => overlay.remove();
  button.addEventListener("click", fechar);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) fechar();
  });

  footer.appendChild(button);
  card.appendChild(badge);
  card.appendChild(title);
  card.appendChild(intro);
  card.appendChild(list);
  card.appendChild(hint);
  card.appendChild(footer);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  return true;
}

function embaralhar(array) {
  const copia = [...array];
  let currentIndex = copia.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [copia[currentIndex], copia[randomIndex]] = [copia[randomIndex], copia[currentIndex]];
  }

  return copia;
}

function calcularQuantidadeTimes(quantidadeGoleiros, quantidadeJogadores, porTime) {
  const total = quantidadeGoleiros + quantidadeJogadores;
  let numTimes = Math.ceil(total / porTime);

  if (quantidadeGoleiros > 0 && quantidadeGoleiros < numTimes && porTime > 1) {
    numTimes = Math.max(numTimes, Math.ceil(quantidadeJogadores / (porTime - 1)));
  }

  return Math.max(1, numTimes);
}

function aplicarRestricoes(times, grupos) {
  const avisos = [];
  const temAlguemDoGrupo = (grupoNorm, time) =>
    time.some(p => grupoNorm.has(normalizarNomeJogador(p)));
  const ehGoleiro = jogador => /\(GOL\)$/i.test(jogador);

  grupos.forEach(grupo => {
    const grupoNorm = new Set(grupo.map(normalizarNomeJogador));

    for (let t = 0; t < times.length; t++) {
      const indices = [];

      for (let j = 0; j < times[t].length; j++) {
        if (grupoNorm.has(normalizarNomeJogador(times[t][j]))) indices.push(j);
      }

      if (indices.length <= 1) continue;

      for (let k = indices.length - 1; k >= 1; k--) {
        const idx = indices[k];
        const jogador = times[t][idx];
        let destino = -1;
        let indiceSubstituto = -1;
        let menor = Infinity;

        for (let tt = 0; tt < times.length; tt++) {
          if (tt === t) continue;
          if (temAlguemDoGrupo(grupoNorm, times[tt])) continue;
          const substituto = times[tt].findIndex(p =>
            !grupoNorm.has(normalizarNomeJogador(p)) && ehGoleiro(p) === ehGoleiro(jogador)
          );

          if (substituto !== -1 && times[tt].length < menor) {
            menor = times[tt].length;
            destino = tt;
            indiceSubstituto = substituto;
          }
        }

        if (destino === -1) {
          avisos.push(`${grupo.join(" / ")}: não foi possível separar totalmente.`);
        } else {
          const substituto = times[destino][indiceSubstituto];
          times[destino][indiceSubstituto] = jogador;
          times[t][idx] = substituto;
        }
      }
    }
  });

  return avisos;
}

function formatarMs(ms) {
  const seguro = Math.max(0, ms);
  const totalCent = Math.floor(seguro / 10);
  const cent = String(totalCent % 100).padStart(2, "0");
  const totalSeconds = Math.floor(seguro / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}:${cent}`;
}

function usePersistentNumber(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = Number(localStorage.getItem(key));
    return Number.isFinite(saved) ? saved : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, String(value));
  }, [key, value]);

  return [value, setValue];
}

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const [route, setRoute] = useState(routeFromHash);
  const [toast, setToast] = useState("");
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("splashSeen"));
  const toastTimer = useRef(null);

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!showSplash) return undefined;
    const id = window.setTimeout(() => {
      sessionStorage.setItem("splashSeen", "true");
      setShowSplash(false);
    }, 2400);
    return () => window.clearTimeout(id);
  }, [showSplash]);

  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      let refreshing = false;
      let updateTimer;
      let handleVisibilityChange;

      const reloadWhenUpdated = () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      };

      const activateWaitingWorker = registration => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      };

      navigator.serviceWorker.addEventListener("controllerchange", reloadWhenUpdated);

      navigator.serviceWorker.register("/service-worker.js").then(registration => {
        activateWaitingWorker(registration);

        registration.addEventListener("updatefound", () => {
          const nextWorker = registration.installing;
          if (!nextWorker) return;

          nextWorker.addEventListener("statechange", () => {
            if (nextWorker.state === "installed" && navigator.serviceWorker.controller) {
              nextWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        const checkForUpdate = () => registration.update().catch(() => {});
        updateTimer = window.setInterval(checkForUpdate, 30 * 60 * 1000);
        handleVisibilityChange = () => {
          if (document.visibilityState === "visible") checkForUpdate();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }).catch(() => {});

      return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", reloadWhenUpdated);
        window.clearInterval(updateTimer);
        if (handleVisibilityChange) {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        }
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!("caches" in window)) return undefined;

    const cacheCurrentApp = () => {
      const sameOriginResources = performance
        .getEntriesByType("resource")
        .map(entry => entry.name)
        .filter(url => url.startsWith(window.location.origin))
        .filter(url => /\.(js|css|png|jpg|jpeg|webp|svg|ico)$/i.test(url));

      const coreUrls = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png", "/rachometro-logo.png", "/splash-soccer.gif"];
      caches
        .open("rachometro-runtime-v12")
        .then(cache => cache.addAll([...new Set([...coreUrls, ...sameOriginResources])]))
        .catch(() => {});
    };

    window.addEventListener("load", cacheCurrentApp, { once: true });
    return () => window.removeEventListener("load", cacheCurrentApp);
  }, []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }

  function goTo(nextRoute) {
    setRoute(nextRoute);
    navigateTo(nextRoute);
  }

  return (
    <>
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
      {showSplash && <SplashScreen onSkip={() => {
        sessionStorage.setItem("splashSeen", "true");
        setShowSplash(false);
      }} />}
      {route === "placar" ? (
        <ScorePage logoUrl={logoUrl} goTo={goTo} showToast={showToast} />
      ) : (
        <DrawPage logoUrl={logoUrl} goTo={goTo} showToast={showToast} />
      )}
    </>
  );
}

function SplashScreen({ onSkip }) {
  return (
    <div className="splash-screen" role="status" aria-live="polite" onClick={onSkip}>
      <div className="splash-content">
        <div className="splash-logo-wrap">
          <img className="splash-animation" src="/splash-soccer.gif" alt="" />
        </div>
        <div>
          <span className="app-kicker">{APP_NAME}</span>
          <h1>RachôMetro</h1>
        </div>
        <div className="splash-loader">
          <span />
        </div>
      </div>
    </div>
  );
}

function DrawPage({ logoUrl, goTo, showToast }) {
  const [modalGuiaAberto, setModalGuiaAberto] = useState(false);
  const [modalCraquesAberto, setModalCraquesAberto] = useState(false);
  const [modalModeloAberto, setModalModeloAberto] = useState(false);
  const [modalidade, setModalidade] = usePersistentState("drawModalidade", "futsal");
  const [jogadoresPorTime, setJogadoresPorTime] = usePersistentState("drawJogadoresPorTime", 5);
  const [modoEntrada, setModoEntrada] = usePersistentState("drawModoEntrada", "lista");
  const [textoBruto, setTextoBruto] = usePersistentState("drawTextoBruto", "");
  const [manualNome, setManualNome] = useState("");
  const [corrigeNome, setCorrigeNome] = useState("");
  const [selectMoverNome, setSelectMoverNome] = useState("");
  const [goleiros, setGoleiros] = usePersistentState("drawGoleiros", []);
  const [jogadores, setJogadores] = usePersistentState("drawJogadores", []);
  const [paresRestritos, setParesRestritos] = usePersistentState("drawParesRestritos", []);
  const [selecaoGrupo, setSelecaoGrupo] = useState([]);
  const [selecaoCraques, setSelecaoCraques] = useState([]);
  const [selecaoAtrasados, setSelecaoAtrasados] = useState([]);
  const [secaoSepararAberta, setSecaoSepararAberta] = useState(false);
  const [secaoCorrigirAberta, setSecaoCorrigirAberta] = useState(false);
  const [secaoAtrasadosAberta, setSecaoAtrasadosAberta] = useState(false);
  const [secaoPagamentoAberta, setSecaoPagamentoAberta] = useState(false);
  const [times, setTimes] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [ultimoTextoCopiavel, setUltimoTextoCopiavel] = useState("");
  const [sorteando, setSorteando] = useState(false);
  const [craquesAplicados, setCraquesAplicados] = usePersistentState("drawCraquesAplicados", []);
  const [atrasadosAplicados, setAtrasadosAplicados] = usePersistentState("drawAtrasadosAplicados", []);
  const [valorQuadra, setValorQuadra] = usePersistentState("drawValorQuadra", "");
  const [pagamentos, setPagamentos] = usePersistentState("drawPagamentos", {});
  const [modeloInfo, setModeloInfo] = usePersistentState("drawModeloInfo", {
    quadra: "",
    endereco: "",
    pix: "",
    valor: "",
    dataHora: "",
    observacoes: ""
  });
  const suspenseTimer = useRef(null);
  const resultadosRef = useRef(null);

  const todosNomes = useMemo(() => [...goleiros, ...jogadores], [goleiros, jogadores]);
  const temNomes = goleiros.length + jogadores.length > 0;
  const podeAcaoPrincipal = temNomes || (modoEntrada === "lista" && textoBruto.trim().length > 0);
  const valorQuadraNumero = Number(String(valorQuadra).replace(",", ".")) || 0;
  const valorPorJogador = jogadores.length ? valorQuadraNumero / jogadores.length : 0;
  const totalPago = jogadores.filter(nome => pagamentos[normalizarNomeJogador(nome)]).length;
  const totalRecebido = totalPago * valorPorJogador;

  const previewLista = useMemo(() => {
    const linhas = [];
    if (goleiros.length) {
      linhas.push("GOLEIROS", ...goleiros.map((nome, i) => `${i + 1}. ${nome}`));
    }
    if (jogadores.length) {
      if (linhas.length) linhas.push("");
      linhas.push("ATLETAS", ...jogadores.map((nome, i) => `${i + 1}. ${nome}`));
    }
    return linhas.join("\n");
  }, [goleiros, jogadores]);

  const maxCraques = useMemo(() => {
    const porTime = Number(jogadoresPorTime);
    if (!porTime || porTime <= 0) return jogadores.length;
    return Math.min(jogadores.length, calcularQuantidadeTimes(goleiros.length, jogadores.length, porTime));
  }, [goleiros.length, jogadores.length, jogadoresPorTime]);

  useEffect(() => {
    return () => window.clearTimeout(suspenseTimer.current);
  }, []);

  useEffect(() => {
    const nomesValidos = new Set(jogadores.map(normalizarNomeJogador));
    setAtrasadosAplicados(prev => prev.filter(nome => nomesValidos.has(normalizarNomeJogador(nome))));
    setSelecaoAtrasados(prev => prev.filter(nome => nomesValidos.has(normalizarNomeJogador(nome))));
    setPagamentos(prev => {
      const proximo = {};
      for (const nome of jogadores) {
        const chave = normalizarNomeJogador(nome);
        if (prev[chave]) proximo[chave] = true;
      }
      return proximo;
    });
  }, [jogadores]);

  function processarLista() {
    if (!textoBruto.trim()) {
      showToast("Cole uma lista antes de processar.");
      return;
    }

    const linhas = textoBruto.split("\n");
    let secao = "none";
    const novosGoleiros = [];
    const novosJogadores = [];

    for (const bruta of linhas) {
      const linha = bruta.trim();
      if (!linha) continue;

      const upper = normalizarCabecalho(linha);
      if (contemCabecalho(upper, CAB_GOLS)) {
        secao = "goleiros";
        continue;
      }
      if (contemCabecalho(upper, CAB_JOGS)) {
        secao = "jogadores";
        continue;
      }
      if (contemCabecalho(upper, CAB_ESPERA)) {
        secao = "espera";
        continue;
      }
      if (contemCabecalho(upper, CAB_SEPARAR)) {
        secao = "separar";
        continue;
      }
      if (secao === "espera" || secao === "separar" || secao === "none") continue;

      const nomeLimpo = limparLinha(linha);
      if (!nomeLimpo) continue;
      if (secao === "goleiros") novosGoleiros.push(nomeLimpo);
      if (secao === "jogadores") novosJogadores.push(nomeLimpo);
    }

    if (avisarNomesDuplicados([...novosGoleiros, ...novosJogadores])) return;

    setGoleiros(novosGoleiros);
    setJogadores(novosJogadores);
    setParesRestritos([]);
    setSelecaoGrupo([]);
    setSelecaoCraques([]);
    setSelecaoAtrasados([]);
    setCraquesAplicados([]);
    setAtrasadosAplicados([]);
    setPagamentos({});
    setTimes([]);
    setAvisos([]);
    setUltimoTextoCopiavel("");
    setModalCraquesAberto(true);
  }

  function finalizarCraques(aplicar) {
    const craques = aplicar ? [...selecaoCraques] : [];
    const atrasados = [...selecaoAtrasados];
    setParesRestritos(craques.length > 1 ? [craques] : []);
    setCraquesAplicados(craques);
    setAtrasadosAplicados(atrasados);
    setModalCraquesAberto(false);
    setSelecaoCraques([]);
    setSelecaoAtrasados([]);
    showToast(atrasados.length ? "Atrasados no último time. Sorteando..." : craques.length ? "Craques marcados. Sorteando..." : "Sorteando sem separar craques...");
    sortearTimes(craques.length > 1 ? [craques] : [], craques, atrasados);
  }

  function sortearTimes(gruposForcados, craquesForcados = craquesAplicados, atrasadosForcados = atrasadosAplicados) {
    if (sorteando) return;
    if (avisarNomesDuplicados([...goleiros, ...jogadores])) return;
    const gruposRestritos = Array.isArray(gruposForcados) ? gruposForcados : paresRestritos;

    const porTime = Number(jogadoresPorTime);
    if (!porTime || porTime <= 0) {
      showToast("Informe jogadores por time.");
      return;
    }

    if (goleiros.length + jogadores.length === 0) {
      showToast("Adicione ou processe nomes antes de sortear.");
      return;
    }

    setSorteando(true);
    setTimes([]);
    setAvisos([]);
    setUltimoTextoCopiavel("");

    suspenseTimer.current = window.setTimeout(() => {
      executarSorteio(porTime, gruposRestritos, craquesForcados, atrasadosForcados);
      setSorteando(false);
    }, 2300);
  }

  function executarSorteio(porTime, gruposRestritos = paresRestritos, craquesMarcados = craquesAplicados, atrasadosMarcados = atrasadosAplicados) {
    let jogadoresSorteio = [...jogadores];
    const goleirosSorteio = [...goleiros];
    const numTimes = calcularQuantidadeTimes(goleirosSorteio.length, jogadoresSorteio.length, porTime);
    const novosTimes = Array.from({ length: numTimes }, () => []);
    const atrasadosSet = new Set(atrasadosMarcados.map(normalizarNomeJogador));

    if (goleirosSorteio.length > 0 && goleirosSorteio.length < numTimes && porTime > 1) {
      for (let t = 0; t < numTimes; t++) {
        novosTimes[t].push(`${goleirosSorteio[t % goleirosSorteio.length]} (GOL)`);
      }
    } else {
      const goleirosTitulares = Math.min(goleirosSorteio.length, numTimes);
      for (let t = 0; t < goleirosTitulares; t++) {
        novosTimes[t].push(`${goleirosSorteio[t]} (GOL)`);
      }
      jogadoresSorteio.push(...goleirosSorteio.slice(numTimes).map(goleiro => `${goleiro} (GOL)`));
    }

    const jogadoresAtrasados = jogadoresSorteio.filter(jogador => atrasadosSet.has(normalizarNomeJogador(jogador)));
    jogadoresSorteio = embaralhar(jogadoresSorteio.filter(jogador => !atrasadosSet.has(normalizarNomeJogador(jogador))));

    let iJog = 0;
    const ultimoTimeIndex = numTimes - 1;
    for (let t = 0; t < numTimes; t++) {
      const limiteTime = t === ultimoTimeIndex ? Math.max(0, porTime - jogadoresAtrasados.length) : porTime;
      while (novosTimes[t].length < limiteTime && iJog < jogadoresSorteio.length) {
        novosTimes[t].push(jogadoresSorteio[iJog]);
        iJog++;
      }
    }

    const novosAvisos = aplicarRestricoes(novosTimes, gruposRestritos);
    if (iJog < jogadoresSorteio.length && novosTimes.length) {
      novosTimes[ultimoTimeIndex].push(...jogadoresSorteio.slice(iJog));
      novosAvisos.push("Alguns atletas também foram para o último time para ninguém ficar fora.");
    }
    if (jogadoresAtrasados.length && novosTimes.length) {
      novosTimes[ultimoTimeIndex].push(...embaralhar(jogadoresAtrasados));
    }
    if (jogadoresAtrasados.length) {
      novosAvisos.push(`Atrasados no último time: ${jogadoresAtrasados.join(", ")}.`);
    }
    if (novosTimes[novosTimes.length - 1]?.length > porTime) {
      novosAvisos.push("O último time ficou maior porque há muitos atrasados marcados.");
    }
    const texto = montarTextoWhatsApp(novosTimes, modalidade, novosAvisos, craquesMarcados, atrasadosMarcados);
    setTimes(novosTimes);
    setAvisos(novosAvisos);
    setUltimoTextoCopiavel(texto);
    showToast("Times revelados.");
    window.setTimeout(() => {
      resultadosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function montarTextoWhatsApp(timesMontados, modalidadeAtual, avisosRestricao, craquesMarcados = craquesAplicados, atrasadosMarcados = atrasadosAplicados) {
    const dataSorteio = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
    let texto = `🏆 *RachôMetro - Sorteio dos Times*\n`;
    texto += `🕒 Sorteio realizado: ${dataSorteio}\n`;
    if (valorQuadraNumero > 0) {
      texto += `💰 Valor da quadra: ${formatarMoeda(valorQuadraNumero)}\n`;
    }
    texto += `━━━━━━━━━━━━━━\n\n`;

    timesMontados.forEach((time, index) => {
      texto += `🟢 *TIME ${index + 1}* (${time.length})\n`;
      time.forEach(jogador => {
        const isGoleiro = jogador.toUpperCase().includes("(GOL)");
        const craque = ehCraque(jogador, craquesMarcados);
        const atrasado = ehAtrasado(jogador, atrasadosMarcados);
        const nome = jogador.replace(/\s*\(GOL\)/i, "").trim();
        const prefixo = atrasado ? "⏳" : craque ? "⭐" : isGoleiro ? "🧤" : "•";
        const detalhe = `${isGoleiro ? " _GOL_" : ""}${atrasado ? " _ATRASADO_" : ""}`;
        texto += `${prefixo} ${nome}${detalhe}\n`;
      });
      texto += "\n";
    });

    if (avisosRestricao.length) {
      texto += `⚠️ *Avisos*\n${avisosRestricao.map(aviso => `• ${aviso}`).join("\n")}\n\n`;
    }

    texto += `Gerado pelo ${APP_NAME}`;
    return texto.trim();
  }

  function montarTextoTimes(timesMontados, modalidadeAtual, avisosRestricao, craquesMarcados = craquesAplicados) {
    let texto = `*GOLEIO* (Sorteio)\nModalidade: ${modalidadeAtual.toUpperCase()}\n\n`;

    timesMontados.forEach((time, index) => {
      texto += `Time ${index + 1}\n`;
      time.forEach(jogador => {
        const craque = ehCraque(jogador, craquesMarcados);
        texto += `${craque ? "⭐ " : "- "}${jogador}\n`;
      });
      texto += "\n";
    });

    if (avisosRestricao.length) {
      texto += `Avisos:\n${avisosRestricao.map(aviso => `- ${aviso}`).join("\n")}\n`;
    }

    return texto.trim();
  }

  async function copiarTexto(texto, sucesso) {
    try {
      await navigator.clipboard.writeText(texto);
      showToast(sucesso);
    } catch {
      showToast("Não foi possível copiar. Verifique as permissões do navegador.");
    }
  }

  function adicionarManual(tipo) {
    const nome = manualNome.trim();
    if (!nome) {
      showToast("Digite um nome para adicionar.");
      return;
    }

    if (avisarNomesDuplicados([...goleiros, ...jogadores, nome])) return;

    if (tipo === "goleiro") setGoleiros(prev => [...prev, nome]);
    else setJogadores(prev => [...prev, nome]);

    setManualNome("");
    showToast(`${nome} adicionado.`);
  }

  function moverJogador(destino) {
    const nome = (corrigeNome || selectMoverNome).trim();
    if (!nome) {
      showToast("Informe ou selecione o nome.");
      return;
    }

    const nomeLower = nome.toLowerCase();
    const idxGol = goleiros.findIndex(n => n.toLowerCase() === nomeLower);
    const idxJog = jogadores.findIndex(n => n.toLowerCase() === nomeLower);

    if (idxGol === -1 && idxJog === -1) {
      showToast("Nome não encontrado.");
      return;
    }

    let nomeMovido = nome;
    const proximosGoleiros = [...goleiros];
    const proximosJogadores = [...jogadores];

    if (idxGol !== -1) nomeMovido = proximosGoleiros.splice(idxGol, 1)[0];
    if (idxJog !== -1) nomeMovido = proximosJogadores.splice(idxJog, 1)[0];

    if (destino === "goleiro") proximosGoleiros.push(nomeMovido);
    else proximosJogadores.push(nomeMovido);

    setGoleiros(proximosGoleiros);
    setJogadores(proximosJogadores);
    setCorrigeNome("");
    setSelectMoverNome("");
    showToast("Jogador movido.");
  }

  function toggleNomeGrupo(nome) {
    setSelecaoGrupo(prev =>
      prev.includes(nome) ? prev.filter(item => item !== nome) : [...prev, nome]
    );
  }

  function toggleAtrasado(nome) {
    setAtrasadosAplicados(prev =>
      prev.includes(nome) ? prev.filter(item => item !== nome) : [...prev, nome]
    );
  }

  function togglePagamento(nome) {
    const chave = normalizarNomeJogador(nome);
    setPagamentos(prev => ({ ...prev, [chave]: !prev[chave] }));
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
  }

  function copiarRateio() {
    if (!valorQuadraNumero || valorQuadraNumero <= 0) {
      showToast("Informe o valor da quadra.");
      return;
    }
    if (!jogadores.length) {
      showToast("Nenhum atleta de linha para dividir.");
      return;
    }

    const pagos = jogadores.filter(nome => pagamentos[normalizarNomeJogador(nome)]);
    const pendentes = jogadores.filter(nome => !pagamentos[normalizarNomeJogador(nome)]);
    let texto = `💰 *Rateio da quadra - ${APP_NAME}*\n`;
    texto += `🏟️ Valor: *${formatarMoeda(valorQuadraNumero)}*\n`;
    texto += `👥 Pagantes: *${jogadores.length} atletas de linha*\n`;
    texto += `🧮 Cada um: *${formatarMoeda(valorPorJogador)}*\n\n`;
    texto += `✅ Recebido até agora: *${formatarMoeda(totalRecebido)}*\n`;
    texto += `⏳ Falta receber: *${formatarMoeda(Math.max(0, valorQuadraNumero - totalRecebido))}*\n\n`;
    texto += `✅ *Pagos (${pagos.length})*\n${pagos.length ? pagos.map(nome => `• ${nome}`).join("\n") : "Ninguém ainda."}\n\n`;
    texto += `⏳ *Falta pagar (${pendentes.length})*\n${pendentes.length ? pendentes.map(nome => `• ${nome}`).join("\n") : "Todo mundo pagou."}`;
    copiarTexto(texto, "Rateio copiado.");
  }

  function criarGrupoSeparado() {
    if (selecaoGrupo.length < 2) {
      showToast("Selecione pelo menos 2 nomes.");
      return;
    }

    const chave = selecaoGrupo.map(normalizarNomeJogador).sort().join("|");
    const existe = paresRestritos.some(grupo => grupo.map(normalizarNomeJogador).sort().join("|") === chave);
    if (existe) {
      showToast("Esse grupo já existe.");
      return;
    }

    setParesRestritos(prev => [...prev, [...selecaoGrupo]]);
    setSelecaoGrupo([]);
    showToast("Grupo adicionado para separar.");
  }

  function limparTudo() {
    setTextoBruto("");
    setManualNome("");
    setCorrigeNome("");
    setSelectMoverNome("");
    setGoleiros([]);
    setJogadores([]);
    setParesRestritos([]);
    setSelecaoGrupo([]);
    setSelecaoCraques([]);
    setSelecaoAtrasados([]);
    setCraquesAplicados([]);
    setAtrasadosAplicados([]);
    setValorQuadra("");
    setPagamentos({});
    setTimes([]);
    setAvisos([]);
    setUltimoTextoCopiavel("");
    setSecaoSepararAberta(false);
    setSecaoCorrigirAberta(false);
    setSecaoAtrasadosAberta(false);
    setSecaoPagamentoAberta(false);
  }

  function ehCraque(jogador, listaCraques = craquesAplicados) {
    const nomeNormalizado = normalizarNomeJogador(jogador);
    return listaCraques.some(nome => normalizarNomeJogador(nome) === nomeNormalizado);
  }

  function ehAtrasado(jogador, listaAtrasados = atrasadosAplicados) {
    const nomeNormalizado = normalizarNomeJogador(jogador);
    return listaAtrasados.some(nome => normalizarNomeJogador(nome) === nomeNormalizado);
  }

  async function colarLista() {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) {
        showToast("Área de transferência vazia.");
        return;
      }
      setTextoBruto(clip);
      showToast("Lista colada.");
    } catch {
      showToast("Não foi possível colar.");
    }
  }

  function mudarModalidade(novaModalidade) {
    const config = MODALIDADES.find(item => item.value === novaModalidade);
    setModalidade(novaModalidade);
    if (config) setJogadoresPorTime(config.jogadores);
  }

  function ajustarJogadoresPorTime(delta) {
    setJogadoresPorTime(prev => Math.max(1, Number(prev || 1) + delta));
  }

  function executarAcaoPrincipal() {
    if (temNomes) {
      sortearTimes();
      return;
    }
    processarLista();
  }

  function copiarTimes() {
    if (ultimoTextoCopiavel) {
      copiarTexto(ultimoTextoCopiavel, "Times copiados.");
      return;
    }
    showToast("Sorteie os times primeiro.");
  }

  function atualizarModeloInfo(campo, valor) {
    setModeloInfo(prev => ({ ...prev, [campo]: valor }));
  }

  function copiarModeloLista() {
    copiarTexto(montarModeloLista(modalidade, jogadoresPorTime, modeloInfo), "Modelo copiado.");
    setModalModeloAberto(false);
  }

  return (
    <div className="app-shell draw-shell">
      <header className="app-topbar">
        <div className="brand-lockup">
          <img className="brand-logo" src={logoUrl} alt={APP_NAME} />
          <div>
            <span className="app-kicker">{APP_NAME}</span>
            <h1>Sorteio de Times</h1>
          </div>
        </div>
        <button className="icon-action" type="button" onClick={() => goTo("placar")}>
          <Timer size={18} />
          <span>Cronômetro</span>
        </button>
      </header>

      <main className="app-main">
        <section className="control-panel compact-panel">
          <div className="section-head">
            <span>Configuração</span>
            <p className="status-pill">Goleiros: {goleiros.length} | Jogadores: {jogadores.length}</p>
          </div>
          <div className="sport-config">
            <div className="sport-options" aria-label="Modalidade">
              {MODALIDADES.map(item => {
                const SportIcon = item.icon;
                return (
                  <button
                    className={modalidade === item.value ? "sport-option active" : "sport-option"}
                    type="button"
                    key={item.value}
                    onClick={() => mudarModalidade(item.value)}
                  >
                    <span className="sport-icon">
                      <SportIcon size={20} strokeWidth={2.4} />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="players-stepper" aria-label="Jogadores por time">
              <span>Por time</span>
              <div>
                <button className="stepper-button" type="button" onClick={() => ajustarJogadoresPorTime(-1)} aria-label="Diminuir jogadores por time">-</button>
                <input
                  type="number"
                  min="1"
                  value={jogadoresPorTime}
                  onChange={event => setJogadoresPorTime(Math.max(1, Number(event.target.value) || 1))}
                  aria-label="Jogadores por time"
                />
                <button className="stepper-button" type="button" onClick={() => ajustarJogadoresPorTime(1)} aria-label="Aumentar jogadores por time">+</button>
              </div>
            </div>
          </div>
        </section>

        <section className="control-panel">
          <div className="mode-toggle">
            <span>Entrada</span>
            <div className="segmented">
              <button className={modoEntrada === "lista" ? "active" : ""} type="button" onClick={() => setModoEntrada("lista")}>
                Colar lista
              </button>
              <button className={modoEntrada === "manual" ? "active" : ""} type="button" onClick={() => setModoEntrada("manual")}>
                Manual
              </button>
            </div>
          </div>

          {modoEntrada === "lista" ? (
            <>
              <label>
                Lista do grupo
                <div className="paste-wrapper">
                  <textarea
                    value={textoBruto}
                    onChange={event => setTextoBruto(event.target.value)}
                    placeholder={"Cole a lista oficial do grupo.\nExemplo:\nGOLEIROS\nATLETAS\nLISTA DE ESPERA"}
                  />
                  <button className="paste-btn" type="button" onClick={colarLista}>
                    Colar
                  </button>
                </div>
              </label>
              <div className="secondary-actions">
                <button className="btn-outline" type="button" onClick={() => setModalModeloAberto(true)}>
                  <ClipboardList size={18} />
                  Modelo
                </button>
                <button className="btn-secondary" type="button" onClick={limparTudo}>
                  <Trash2 size={18} />
                  Limpar
                </button>
              </div>
            </>
          ) : (
            <>
              <label>
                Jogador
                <input
                  value={manualNome}
                  onChange={event => setManualNome(event.target.value)}
                  placeholder="Nome do jogador"
                />
              </label>
              <div className="compact-actions">
                <button className="btn-outline" type="button" onClick={() => adicionarManual("jogador")}>
                  <UserPlus size={18} />
                  Linha
                </button>
                <button className="btn-secondary" type="button" onClick={() => adicionarManual("goleiro")}>
                  <Shield size={18} />
                  GOL
                </button>
              </div>
              <div className="compact-actions utility-actions">
                <button className="btn-outline" type="button" onClick={() => setSecaoSepararAberta(prev => !prev)}>
                  Separar craques
                </button>
                <button className="btn-outline" type="button" onClick={() => setSecaoCorrigirAberta(prev => !prev)}>
                  Mover função
                </button>
              </div>
            </>
          )}

          {temNomes && (
            <div className="compact-actions utility-actions">
              <button className="btn-outline" type="button" onClick={() => setSecaoAtrasadosAberta(prev => !prev)}>
                <Hourglass size={18} />
                Atrasados
              </button>
              <button className="btn-outline" type="button" onClick={() => setSecaoPagamentoAberta(prev => !prev)}>
                <HandCoins size={18} />
                Rateio
              </button>
            </div>
          )}

          {secaoAtrasadosAberta && (
            <div className="tool-box">
              <label>Atrasados para o último time</label>
              <p className="hint">Marque quem ainda não chegou. No sorteio, esses atletas entram no último time.</p>
              <NameGrid nomes={jogadores} selecionados={atrasadosAplicados} onToggle={toggleAtrasado} />
            </div>
          )}

          {secaoPagamentoAberta && (
            <div className="tool-box payment-box">
              <label>
                Valor da quadra
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={valorQuadra}
                  onChange={event => setValorQuadra(event.target.value)}
                  placeholder="Ex: 180"
                />
              </label>
              <div className="payment-summary">
                <span>{jogadores.length} atletas</span>
                <strong>{formatarMoeda(valorPorJogador)} cada</strong>
                <span>Recebido: {formatarMoeda(totalRecebido)}</span>
                <span>{totalPago}/{jogadores.length} pagos</span>
              </div>
              <div className="payment-list">
                {jogadores.length ? jogadores.map(nome => {
                  const pago = pagamentos[normalizarNomeJogador(nome)];
                  return (
                    <button className={pago ? "payment-chip paid" : "payment-chip"} type="button" key={nome} onClick={() => togglePagamento(nome)}>
                      <span>{pago ? "✓" : "○"}</span>
                      {nome}
                    </button>
                  );
                }) : <span className="hint">Goleiros não entram no rateio. Adicione atletas de linha.</span>}
              </div>
              <div className="compact-actions">
                <button className="btn-outline" type="button" onClick={copiarRateio}>Copiar rateio</button>
                <button className="btn-secondary" type="button" onClick={() => setPagamentos({})}>Limpar pagos</button>
              </div>
            </div>
          )}

          {secaoSepararAberta && (
            <div className="tool-box">
              <label>Evitar que joguem juntos</label>
              <NameGrid nomes={todosNomes} selecionados={selecaoGrupo} onToggle={toggleNomeGrupo} />
              <div className="compact-actions">
                <button type="button" onClick={criarGrupoSeparado}>Separar selecionados</button>
                <button className="btn-outline" type="button" onClick={() => setSelecaoGrupo([])}>Limpar seleção</button>
              </div>
              <div className="pair-list">
                {paresRestritos.length ? paresRestritos.map((grupo, index) => (
                  <span className="pair-chip" key={grupo.join("-")}>
                    {grupo.join(" / ")}
                    <button type="button" onClick={() => setParesRestritos(prev => prev.filter((_, i) => i !== index))}>Remover</button>
                  </span>
                )) : <span className="hint">Nenhum grupo cadastrado.</span>}
              </div>
            </div>
          )}

          {secaoCorrigirAberta && (
            <div className="tool-box">
              <label>
                Mover jogador
                <select value={selectMoverNome} onChange={event => setSelectMoverNome(event.target.value)}>
                  <option value="">Selecione</option>
                  {todosNomes.map(nome => <option key={nome} value={nome}>{nome}</option>)}
                </select>
              </label>
              <input value={corrigeNome} onChange={event => setCorrigeNome(event.target.value)} placeholder="Ou digite um nome" />
              <div className="compact-actions">
                <button className="btn-outline" type="button" onClick={() => moverJogador("goleiro")}>Para GOL</button>
                <button className="btn-outline" type="button" onClick={() => moverJogador("jogador")}>Para Linha</button>
              </div>
            </div>
          )}

          {modoEntrada === "manual" && (
            <label>
              Prévia
              <textarea className="textarea-ghost" readOnly value={previewLista} placeholder="Nenhum nome adicionado ainda." />
            </label>
          )}
        </section>

        <section className="results-panel" ref={resultadosRef}>
          {avisos.map(aviso => <p className="warning-line" key={aviso}>{aviso}</p>)}
          <div className="times-container">
            {times.map((time, index) => (
              <div className="time-card" key={`time-${index + 1}`}>
                <h3>
                  Time {index + 1}
                  <span className="badge">{time.length}</span>
                </h3>
                <ul>
                  {time.map(jogador => {
                    const isGoleiro = jogador.toUpperCase().includes("(GOL)");
                    const isCraque = ehCraque(jogador);
                    const isAtrasado = ehAtrasado(jogador);
                    return (
                      <li className={`${isGoleiro ? "goleiro" : ""} ${isCraque ? "craque" : ""} ${isAtrasado ? "atrasado" : ""}`} key={`${index}-${jogador}`}>
                        <span className="player-name">
                          {isCraque && <Star className="craque-star" size={15} fill="currentColor" />}
                          {isAtrasado && <span className="late-mark" aria-label="Atrasado">⏳</span>}
                          {jogador.replace(/\s*\(GOL\)/i, "")}
                        </span>
                        {isAtrasado && <span className="tag-late">ATR</span>}
                        {isGoleiro && <span className="tag-gol">GOL</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <p className="footer-info">{APP_NAME}</p>

      <div className="bottom-action-bar" role="toolbar" aria-label="Acoes do sorteio">
        <button className="bottom-main-action" type="button" onClick={executarAcaoPrincipal} disabled={sorteando || !podeAcaoPrincipal}>
          {temNomes ? <Sparkles size={19} /> : <Shuffle size={19} />}
          {sorteando ? "Sorteando..." : temNomes ? "Sortear" : "Processar"}
        </button>
        <button className="bottom-icon-action" type="button" onClick={copiarTimes} disabled={!ultimoTextoCopiavel} aria-label="Copiar times">
          <Clipboard size={20} />
        </button>
        <button className="bottom-icon-action" type="button" onClick={() => setModalGuiaAberto(true)} aria-label="Abrir ajuda">
          <Info size={20} />
        </button>
      </div>

      {modalGuiaAberto && (
        <GuideModal onClose={() => setModalGuiaAberto(false)} onCopyModel={() => setModalModeloAberto(true)} />
      )}

      {modalModeloAberto && (
        <ModeloListaModal
          info={modeloInfo}
          onChange={atualizarModeloInfo}
          onClose={() => setModalModeloAberto(false)}
          onCopy={copiarModeloLista}
        />
      )}

      {modalCraquesAberto && (
        <CraquesModal
          jogadores={jogadores}
          maxCraques={maxCraques}
          selecionados={selecaoCraques}
          setSelecionados={setSelecaoCraques}
          atrasados={selecaoAtrasados}
          setAtrasados={setSelecaoAtrasados}
          onSkip={() => finalizarCraques(false)}
          onApply={() => finalizarCraques(true)}
        />
      )}

      {sorteando && (
        <DrawSuspenseOverlay totalNomes={goleiros.length + jogadores.length} totalGoleiros={goleiros.length} />
      )}

    </div>
  );
}

function DrawSuspenseOverlay({ totalNomes, totalGoleiros }) {
  return (
    <div className="draw-suspense" role="status" aria-live="polite">
      <div className="draw-suspense-card">
        <div className="mystery-stage">
          <div className="draw-orbit draw-orbit-one" />
          <div className="draw-orbit draw-orbit-two" />
          <JerseyIcon />
          <div className="shuffle-card card-a">GOL</div>
          <div className="shuffle-card card-b">10</div>
          <div className="shuffle-card card-c">7</div>
        </div>
        <p className="draw-kicker">Mistério no ar</p>
        <h2>Montando os times...</h2>
        <div className="draw-meter">
          <span />
        </div>
        <p className="draw-copy">
          {totalNomes} nomes na lista, {totalGoleiros} goleiro{totalGoleiros === 1 ? "" : "s"} na disputa.
        </p>
      </div>
    </div>
  );
}

function JerseyIcon() {
  return (
    <svg className="jersey-icon" viewBox="0 0 120 120" aria-hidden="true">
      <path className="jersey-shadow" d="M32 26 16 49l15 18 10-8v42c13 4 38 4 50 0V59l10 8 15-18-16-23-23-10H55L32 26Z" />
      <path className="jersey-body" d="M33 25 18 48l14 17 10-8v42c13 4 36 4 48 0V57l10 8 14-17-15-23-22-9H55L33 25Z" />
      <path className="jersey-trim" d="M47 30c8-4 28-4 36 0l-5 11c-7-3-20-3-27 0l-4-11Z" />
      <path className="jersey-stripe left" d="M28 40 42 58v40" />
      <path className="jersey-stripe right" d="M102 40 90 58v40" />
      <text x="60" y="72" textAnchor="middle">8</text>
    </svg>
  );
}

function NameGrid({ nomes, selecionados, onToggle }) {
  if (!nomes.length) return <span className="hint">Nenhum nome carregado.</span>;

  return (
    <div className="name-grid">
      {nomes.map(nome => (
        <button
          className={selecionados.includes(nome) ? "name-chip selected" : "name-chip"}
          type="button"
          key={nome}
          onClick={() => onToggle(nome)}
        >
          {nome}
        </button>
      ))}
    </div>
  );
}

function GuideModal({ onClose, onCopyModel }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={event => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar ajuda">
          <X size={18} />
        </button>
        <div className="modal-head">
          <div className="modal-chip"><Info size={16} /> Guia rápido</div>
          <h2>Como usar sem erro</h2>
        </div>
        <p className="modal-copy">
          Cole a lista, ajuste os craques se precisar e use a barra de baixo para processar, sortear ou copiar.
        </p>
        <div className="modal-grid">
          <Tip icon={<ClipboardCheck />} title="Lista">Cole a mensagem e use Processar na barra fixa de baixo.</Tip>
          <Tip icon={<Tag />} title="Cabeçalhos aceitos">Use GOLEIROS, GOL, ATLETAS ou LINHA.</Tip>
          <Tip icon={<List />} title="Modelo">Copia um modelo com a quantidade certa para a modalidade selecionada.</Tip>
          <Tip icon={<RotateCcw />} title="Goleiro por time">Se faltar goleiro, o app repete em rodízio.</Tip>
        </div>
        <div className="modal-actions">
          <button className="btn-outline" type="button" onClick={onCopyModel}>Copiar modelo</button>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function Tip({ icon, title, children }) {
  return (
    <div className="card-tip">
      {icon}
      <div>
        <strong>{title}</strong>
        {children}
      </div>
    </div>
  );
}

function ModeloListaModal({ info, onChange, onClose, onCopy }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={event => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar modelo">
          <X size={18} />
        </button>
        <div className="modal-head">
          <div className="modal-chip"><ClipboardList size={16} /> Modelo da lista</div>
          <h2>Dados do convite</h2>
        </div>
        <p className="modal-copy">
          Preencha só o que quiser. Esses dados ficam salvos no app para os próximos rachas.
        </p>
        <div className="model-form">
          <label>
            Nome da quadra
            <input value={info.quadra} onChange={event => onChange("quadra", event.target.value)} placeholder="Ex: Arena Goleio" />
          </label>
          <label>
            Data e horário
            <input value={info.dataHora} onChange={event => onChange("dataHora", event.target.value)} placeholder="Ex: Hoje às 20h" />
          </label>
          <label>
            Endereço
            <input value={info.endereco} onChange={event => onChange("endereco", event.target.value)} placeholder="Rua, número, bairro" />
          </label>
          <label>
            Valor
            <input value={info.valor} onChange={event => onChange("valor", event.target.value)} placeholder="Ex: R$ 180,00 total ou R$ 20 por pessoa" />
          </label>
          <label>
            Pix
            <input value={info.pix} onChange={event => onChange("pix", event.target.value)} placeholder="Chave Pix para pagamento" />
          </label>
          <label>
            Observações
            <textarea value={info.observacoes} onChange={event => onChange("observacoes", event.target.value)} placeholder="Ex: Chegar 10 min antes. Levar camisa clara e escura." />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn-outline" type="button" onClick={onClose}>Cancelar</button>
          <button type="button" onClick={onCopy}><Clipboard size={18} /> Copiar modelo</button>
        </div>
      </div>
    </div>
  );
}

function CraquesModal({ jogadores, maxCraques, selecionados, setSelecionados, atrasados, setAtrasados, onSkip, onApply }) {
  function toggle(nome) {
    setSelecionados(prev => {
      if (prev.includes(nome)) return prev.filter(item => item !== nome);
      if (prev.length >= maxCraques) return prev;
      setAtrasados(lista => lista.filter(item => item !== nome));
      return [...prev, nome];
    });
  }

  function toggleAtrasadoModal(nome) {
    setAtrasados(prev => {
      if (prev.includes(nome)) return prev.filter(item => item !== nome);
      setSelecionados(lista => lista.filter(item => item !== nome));
      return [...prev, nome];
    });
  }

  return (
    <div className="modal-overlay" onClick={onSkip}>
      <div className="modal-box" onClick={event => event.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-chip"><Trophy size={16} /> Equilíbrio</div>
          <h2>Separar os craques</h2>
        </div>
        <p className="modal-copy">
          Selecione até {maxCraques} jogador{maxCraques === 1 ? "" : "es"}. Cada selecionado fica em um time diferente.
        </p>
        <p className="modal-subtitle">Craques</p>
        <div className="name-grid modal-name-grid">
          {jogadores.length ? jogadores.map(nome => {
            const ativo = selecionados.includes(nome);
            return (
              <button
                className={ativo ? "name-chip selected" : "name-chip"}
                disabled={!ativo && selecionados.length >= maxCraques}
                type="button"
                key={nome}
                onClick={() => toggle(nome)}
              >
                {ativo && <Star size={13} fill="currentColor" />}
                {nome}
              </button>
            );
          }) : <span className="hint">Nenhum jogador de linha encontrado.</span>}
        </div>
        <p className="modal-subtitle">Atrasados para o último time</p>
        <div className="name-grid modal-name-grid compact-name-grid">
          {jogadores.length ? jogadores.map(nome => {
            const ativo = atrasados.includes(nome);
            return (
              <button
                className={ativo ? "name-chip selected late-chip" : "name-chip"}
                type="button"
                key={`late-${nome}`}
                onClick={() => toggleAtrasadoModal(nome)}
              >
                {ativo && "⏳ "}
                {nome}
              </button>
            );
          }) : <span className="hint">Nenhum atleta para marcar.</span>}
        </div>
        <div className="modal-actions">
          <button className="btn-outline" type="button" onClick={onSkip}>Sortear sem separar</button>
          <button type="button" onClick={onApply}><Check size={18} /> Aplicar e sortear</button>
        </div>
      </div>
    </div>
  );
}

function ScorePage({ logoUrl, goTo, showToast }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [clock, setClock] = useState("--:--:--");
  const [now, setNow] = useState(Date.now());
  const [mode, setMode] = useState(() => localStorage.getItem("modo") || "chrono");
  const [running, setRunning] = useState(() => localStorage.getItem("timerRunning") === "true");
  const [runStartedAt, setRunStartedAt] = usePersistentNumber("timerRunStartedAt", 0);
  const [elapsedMs, setElapsedMs] = usePersistentNumber("elapsedMs", 0);
  const [timerMinutes, setTimerMinutes] = useState(() => Number(localStorage.getItem("timerMinutes")) || 7);
  const [timerEditorOpen, setTimerEditorOpen] = useState(false);
  const [draftTimerMinutes, setDraftTimerMinutes] = useState(() => Number(localStorage.getItem("timerMinutes")) || 7);
  const [timerRestanteMs, setTimerRestanteMs] = usePersistentNumber("timerRestanteMs", 7 * 60 * 1000);
  const [alertFim, setAlertFim] = useState(false);
  const [score1, setScore1] = usePersistentNumber("score1", 0);
  const [score2, setScore2] = usePersistentNumber("score2", 0);
  const [team1Name, setTeam1Name] = useState(() => localStorage.getItem("team1Name") || "Time 1");
  const [team2Name, setTeam2Name] = useState(() => localStorage.getItem("team2Name") || "Time 2");
  const [editingTeam, setEditingTeam] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fimTimerNotificadoRef = useRef(false);

  useEffect(() => {
    document.body.classList.toggle("light-theme", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const tick = () => {
      const agora = new Date();
      const h = String(agora.getHours()).padStart(2, "0");
      const m = String(agora.getMinutes()).padStart(2, "0");
      const s = String(agora.getSeconds()).padStart(2, "0");
      setClock(`${h}:${m}:${s}`);
      setNow(agora.getTime());
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem("modo", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("timerRunning", String(running));
  }, [running]);

  useEffect(() => {
    localStorage.setItem("timerMinutes", String(timerMinutes));
  }, [timerMinutes]);

  useEffect(() => {
    if (timerEditorOpen) setDraftTimerMinutes(timerMinutes);
  }, [timerEditorOpen, timerMinutes]);

  useEffect(() => {
    localStorage.setItem("team1Name", team1Name);
  }, [team1Name]);

  useEffect(() => {
    localStorage.setItem("team2Name", team2Name);
  }, [team2Name]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const tempoAtual = calcularTempoAtual(now);

  useEffect(() => {
    if (!running || mode !== "timer") {
      fimTimerNotificadoRef.current = false;
      return;
    }

    if (tempoAtual <= 0 && !fimTimerNotificadoRef.current) {
      fimTimerNotificadoRef.current = true;
      setRunning(false);
      setRunStartedAt(0);
      setTimerRestanteMs(0);
      setAlertFim(true);
      tocarBeep();
      void showNotification(`${APP_NAME} - Timer`, "O tempo acabou!");
    }
  }, [mode, running, tempoAtual, setRunStartedAt, setTimerRestanteMs]);

  function calcularTempoAtual(baseNow = Date.now()) {
    if (!running || !runStartedAt) {
      return mode === "chrono" ? elapsedMs : timerRestanteMs;
    }

    const delta = Math.max(0, baseNow - runStartedAt);
    if (mode === "chrono") return elapsedMs + delta;
    return Math.max(0, timerRestanteMs - delta);
  }

  function pausarTempo() {
    if (!running) return;
    const atual = calcularTempoAtual();
    if (mode === "chrono") setElapsedMs(atual);
    else setTimerRestanteMs(atual);
    setRunning(false);
    setRunStartedAt(0);
  }

  function iniciarTempo() {
    if (running) return;
    prepararAudioAlerta();
    setAlertFim(false);
    fimTimerNotificadoRef.current = false;

    if (mode === "timer" && timerRestanteMs <= 0) {
      setTimerRestanteMs(Number(timerMinutes) * 60 * 1000);
    }

    setRunStartedAt(Date.now());
    setRunning(true);
  }

  function setModoChrono() {
    pausarTempo();
    setMode("chrono");
    setAlertFim(false);
  }

  function setModoTimer() {
    pausarTempo();
    setMode("timer");
    setAlertFim(false);
    if (timerRestanteMs <= 0) setTimerRestanteMs(Number(timerMinutes) * 60 * 1000);
  }

  function resetTempo() {
    setRunning(false);
    setRunStartedAt(0);
    setAlertFim(false);
    if (mode === "chrono") setElapsedMs(0);
    else setTimerRestanteMs(Number(timerMinutes) * 60 * 1000);
    setConfirmReset(false);
  }

  function mudarTimerMinutes(value) {
    const minutes = Math.max(1, Number(value) || 1);
    setTimerMinutes(minutes);
    if (mode === "timer" && !running) setTimerRestanteMs(minutes * 60 * 1000);
  }

  function ajustarDraftTimer(delta) {
    setDraftTimerMinutes(prev => String(Math.max(1, Math.min(99, (Number(prev) || 0) + delta))));
  }

  function aplicarTimerEdit() {
    const minutes = Math.max(1, Math.min(99, Number(draftTimerMinutes) || 7));
    setTimerMinutes(minutes);
    if (mode === "timer") {
      setTimerRestanteMs(minutes * 60 * 1000);
      setRunStartedAt(running ? Date.now() : 0);
      setAlertFim(false);
      fimTimerNotificadoRef.current = false;
    }
    setTimerEditorOpen(false);
  }

  function addExtraTime(minutes) {
    if (mode !== "timer") return;
    if (running) {
      setTimerRestanteMs(calcularTempoAtual() + minutes * 60 * 1000);
      setRunStartedAt(Date.now());
    } else {
      setTimerRestanteMs(prev => prev + minutes * 60 * 1000);
    }
    setAlertFim(false);
  }

  function fecharAlertaTimer() {
    setAlertFim(false);
    setRunning(false);
    setRunStartedAt(0);
    fimTimerNotificadoRef.current = true;
    if (mode === "timer") {
      setTimerRestanteMs(Number(timerMinutes) * 60 * 1000);
    }
  }

  function resetPlacar() {
    setScore1(0);
    setScore2(0);
    showToast("Placar zerado.");
  }

  return (
    <div className="app-shell score-shell">
      <header className="app-topbar">
        <div className="brand-lockup">
          <img className="brand-logo" src={logoUrl} alt={APP_NAME} />
          <div>
            <span className="app-kicker">{APP_NAME}</span>
            <h1>Cronômetro</h1>
          </div>
        </div>
        <button className="icon-action theme-action" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? "Escuro" : "Claro"}
        </button>
      </header>

      <div className="quick-nav">
        <button className="btn-secondary score-nav-button" type="button" onClick={() => goTo("sorteio")}>
          <Shuffle size={17} />
          <span>Sorteio</span>
        </button>
        <div className="clock">{clock}</div>
      </div>

      <main className="match-layout">
        <section className="match-panel timer-panel">
          <div className="section-row tight-row">
            <p className="section-title">{mode === "chrono" ? "Cronômetro" : "Timer da partida"}</p>
          </div>

          <div className="segmented">
            <button className={mode === "chrono" ? "active" : ""} type="button" onClick={setModoChrono}>Cronômetro</button>
            <button className={mode === "timer" ? "active" : ""} type="button" onClick={setModoTimer}>Timer</button>
          </div>

          <button
            className={mode === "timer" ? "chrono-time is-editable" : "chrono-time"}
            type="button"
            onClick={() => mode === "timer" && setTimerEditorOpen(true)}
            aria-label={mode === "timer" ? "Ajustar tempo do timer" : "Tempo atual"}
          >
            <span>{formatarMs(tempoAtual)}</span>
            {mode === "timer" && <small>{timerMinutes} min</small>}
          </button>
          <div className="timer-actions">
            <button className="timer-icon-button play-button" type="button" onClick={iniciarTempo} aria-label="Iniciar">
              <Play size={22} fill="currentColor" />
            </button>
            <button className="timer-icon-button pause-button" type="button" onClick={pausarTempo} aria-label="Pausar">
              <Pause size={22} fill="currentColor" />
            </button>
            <button className="timer-icon-button reset-button" type="button" onClick={() => setConfirmReset(true)} aria-label="Zerar">
              <RotateCcw size={22} />
            </button>
          </div>
          <div className="extra-time-btns">
            <button className="btn-secondary" type="button" onClick={() => addExtraTime(1)}>+1 min</button>
            <button className="btn-secondary" type="button" onClick={() => addExtraTime(3)}>+3 min</button>
            <button className="btn-secondary" type="button" onClick={() => addExtraTime(5)}>+5 min</button>
          </div>
        </section>

        <section className="match-panel">
          <div className="section-row">
            <p className="section-title">Placar</p>
            <button className="mini-action" type="button" onClick={resetPlacar}>Zerar placar</button>
          </div>
          <div className="scoreboard">
            <TeamCard
              score={score1}
              setScore={setScore1}
              name={team1Name}
              setName={setTeam1Name}
              editing={editingTeam === 1}
              setEditing={() => setEditingTeam(1)}
              closeEditing={() => setEditingTeam(null)}
            />
            <TeamCard
              score={score2}
              setScore={setScore2}
              name={team2Name}
              setName={setTeam2Name}
              editing={editingTeam === 2}
              setEditing={() => setEditingTeam(2)}
              closeEditing={() => setEditingTeam(null)}
            />
          </div>
        </section>
      </main>

      {timerEditorOpen && (
        <div className="modal-overlay" onClick={() => setTimerEditorOpen(false)}>
          <div className="modal-box compact-modal" onClick={event => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setTimerEditorOpen(false)} aria-label="Fechar ajuste de tempo">
              <X size={18} />
            </button>
            <div className="modal-head">
              <div className="modal-chip"><Timer size={16} /> Timer</div>
              <h2>Ajustar tempo</h2>
            </div>
            <div className="timer-editor">
              <button className="stepper-button" type="button" onClick={() => ajustarDraftTimer(-1)} aria-label="Diminuir tempo">-</button>
              <label>
                Minutos
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={draftTimerMinutes}
                  onChange={event => {
                    const value = event.target.value;
                    if (value === "") {
                      setDraftTimerMinutes("");
                      return;
                    }
                    setDraftTimerMinutes(String(Math.max(1, Math.min(99, Number(value) || 1))));
                  }}
                  autoFocus
                />
              </label>
              <button className="stepper-button" type="button" onClick={() => ajustarDraftTimer(1)} aria-label="Aumentar tempo">+</button>
            </div>
            <div className="timer-presets">
              {[5, 7, 10, 15].map(minutes => (
                <button className="btn-outline" type="button" key={minutes} onClick={() => setDraftTimerMinutes(String(minutes))}>
                  {minutes} min
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-outline" type="button" onClick={() => setTimerEditorOpen(false)}>Cancelar</button>
              <button type="button" onClick={aplicarTimerEdit}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal-box compact-modal" onClick={event => event.stopPropagation()}>
            <h2>Confirmar</h2>
            <p className="modal-copy">Tem certeza que deseja zerar o tempo?</p>
            <div className="modal-actions">
              <button className="btn-outline" type="button" onClick={() => setConfirmReset(false)}>Cancelar</button>
              <button className="btn-danger" type="button" onClick={resetTempo}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {alertFim && (
        <TimerFinishedOverlay onClose={fecharAlertaTimer} onExtraTime={addExtraTime} />
      )}
    </div>
  );
}

function TimerFinishedOverlay({ onClose, onExtraTime }) {
  return (
    <div className="timer-finished" role="alert" aria-live="assertive" onClick={onClose}>
      <div className="timer-finished-card" onClick={event => event.stopPropagation()}>
        <button className="modal-close alarm-close" type="button" onClick={onClose} aria-label="Fechar alerta">
          <X size={18} />
        </button>
        <div className="alarm-stage">
          <div className="alarm-ring ring-a" />
          <div className="alarm-ring ring-b" />
          <div className="alarm-core">
            <Timer size={42} />
          </div>
          <span className="beep beep-a">PI</span>
          <span className="beep beep-b">PI</span>
          <span className="beep beep-c">PI</span>
        </div>
        <p className="draw-kicker">Timer</p>
        <h2>Fim do tempo!</h2>
        <p className="draw-copy">pi pi pi pi</p>
        <div className="timer-finished-actions">
          <button type="button" onClick={() => onExtraTime(1)}>+1 min</button>
          <button className="btn-outline" type="button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function TeamCard({ score, setScore, name, setName, editing, setEditing, closeEditing }) {
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    setDraftName(name);
  }, [name]);

  function saveName() {
    setName(draftName.trim() || name);
    closeEditing();
  }

  return (
    <div className="team-card">
      {editing ? (
        <input
          className="team-name-input"
          value={draftName}
          autoFocus
          onChange={event => setDraftName(event.target.value)}
          onBlur={saveName}
          onKeyDown={event => {
            if (event.key === "Enter") saveName();
            if (event.key === "Escape") closeEditing();
          }}
        />
      ) : (
        <button className="team-name" type="button" onClick={setEditing}>{name}</button>
      )}
      <div className="score">{score}</div>
      <div className="score-btns">
        <button className="btn-secondary" type="button" onClick={() => setScore(prev => Math.max(0, prev - 1))}>-</button>
        <button type="button" onClick={() => setScore(prev => prev + 1)}>+</button>
      </div>
    </div>
  );
}

let audioContextAlerta;

function getAudioContextAlerta() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContextAlerta ||= new AudioContextClass();
  return audioContextAlerta;
}

function prepararAudioAlerta() {
  try {
    const ctx = getAudioContextAlerta();
    if (ctx?.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  } catch {}
}

function tocarBeep(vezes = 5, intervalo = 240) {
  let count = 0;

  function beep() {
    try {
      const ctx = getAudioContextAlerta();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1040, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.17);
    } catch {
      return;
    }

    count++;
    if (count < vezes) window.setTimeout(beep, intervalo);
  }

  beep();
}

async function showNotification(title, body) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const options = {
      body,
      icon: "/icon-512.png",
      badge: "/icon-192.png",
      tag: "rachometro-timer",
      requireInteraction: true
    };

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification(title, options);
        return;
      }
    }

    new Notification(title, options);
  } catch {
    // Android browsers can reject notification construction inside PWAs.
  }
}

export default App;
