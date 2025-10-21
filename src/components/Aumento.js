import React, { useEffect, useRef, useState } from "react";

export default function Aumento() {
  const [noPosition, setNoPosition] = useState({ x: 37, y: 62.5 });
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // partículas e mensagens
  const [particles, setParticles] = useState([]);
  const [showSimMessage, setShowSimMessage] = useState(false);

  const containerRef = useRef(null);
  const simButtonRef = useRef(null);

  // refs para timers (para limpar se clicar rápido)
  const messageTimerRef = useRef(null);
  const particlesTimerRef = useRef(null);

  // Tenta iniciar autoplay muted ao montar (alguns navegadores permitem)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = true;
    audio.loop = true;
    audio.play().catch(() => {});

    const enableSoundOnFirstInteraction = async () => {
      if (!audio) return;
      try {
        audio.muted = false;
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        try {
          const a = new Audio("/audio/musica.mp3");
          a.loop = true;
          await a.play();
          audioRef.current = a;
          setIsPlaying(true);
        } catch (err2) {
          console.warn("Não foi possível iniciar o áudio com som:", err2);
        }
      } finally {
        setHasUserInteracted(true);
        window.removeEventListener("click", enableSoundOnFirstInteraction);
        window.removeEventListener("touchstart", enableSoundOnFirstInteraction);
        window.removeEventListener("keydown", enableSoundOnFirstInteraction);
      }
    };

    window.addEventListener("click", enableSoundOnFirstInteraction);
    window.addEventListener("touchstart", enableSoundOnFirstInteraction);
    window.addEventListener("keydown", enableSoundOnFirstInteraction);

    return () => {
      window.removeEventListener("click", enableSoundOnFirstInteraction);
      window.removeEventListener("touchstart", enableSoundOnFirstInteraction);
      window.removeEventListener("keydown", enableSoundOnFirstInteraction);
      // limpar timers se houver
      clearTimeout(messageTimerRef.current);
      clearTimeout(particlesTimerRef.current);
    };
  }, []);

  const handleNoClick = () => {
    const minX = 10;
    const maxX = 90;
    const minY = 10;
    const maxY = 90;
    const minDistance = 12;

    let newX, newY;
    let attempts = 0;
    do {
      newX = Math.random() * (maxX - minX) + minX;
      newY = Math.random() * (maxY - minY) + minY;
      attempts++;
      if (attempts > 40) break;
    } while (Math.hypot(newX - noPosition.x, newY - noPosition.y) < minDistance);

    setNoPosition({ x: newX, y: newY });
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        audio.muted = false;
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Falha ao tocar:", err);
      }
    }
  };

  // garante que o áudio esteja tocando (usado ao clicar SIM)
  const ensureAudioPlaying = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.muted = false;
      await audio.play();
      setIsPlaying(true);
      setHasUserInteracted(true);
    } catch (err) {
      try {
        const a = new Audio("/audio/musica.mp3");
        a.loop = true;
        await a.play();
        audioRef.current = a;
        setIsPlaying(true);
        setHasUserInteracted(true);
      } catch (err2) {
        console.warn("Falha ao forçar áudio:", err2);
      }
    }
  };

  // cria partículas em torno do botão SIM (posição em tela)
  const explodeAtSim = () => {
    const simEl = simButtonRef.current;
    const containerEl = containerRef.current;
    if (!simEl || !containerEl) return;

    const simRect = simEl.getBoundingClientRect();
    const contRect = containerEl.getBoundingClientRect();

    const centerX = simRect.left + simRect.width / 2 - contRect.left;
    const centerY = simRect.top + simRect.height / 2 - contRect.top;

    const N = 18;
    const colors = ["#FFD166", "#FF6B6B", "#5EEAD4", "#60A5FA", "#F472B6"];

    // ids mais únicas (timestamp + random)
    const now = Date.now();
    const newParticles = Array.from({ length: N }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 90;
      const size = 6 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        id: `${now}-${i}-${Math.floor(Math.random() * 10000)}`,
        x: centerX,
        y: centerY,
        angle,
        distance,
        size,
        color,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance * 0.8,
      };
    });

    // limpar timer anterior de partículas (para clique rápido)
    if (particlesTimerRef.current) {
      clearTimeout(particlesTimerRef.current);
    }

    setParticles(newParticles);

    // remove partículas após animação (1100ms)
    particlesTimerRef.current = setTimeout(() => {
      setParticles([]);
      particlesTimerRef.current = null;
    }, 1100);
  };

  // clique no SIM: garante áudio, explode e mostra mensagem
  const handleSimClick = async () => {
    await ensureAudioPlaying();

    // partículas
    explodeAtSim();

    // garantir que a mensagem apareça sempre: limpar timeout anterior e setar novamente
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }

    setShowSimMessage(true);

    // aumentar tempo de exibição da mensagem para 3000ms
    messageTimerRef.current = setTimeout(() => {
      setShowSimMessage(false);
      messageTimerRef.current = null;
    }, 1000);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#1a004bff",
      }}
    >
      {/* áudio - arquivo em public/audio/musica.mp3 */}
      <audio ref={audioRef} src="/audio/musica.mp3" />

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxHeight: "100vh",
        }}
      >
        {/* Imagem de fundo */}
        <img
          src="/imagens/ChatGPTImage.png"
          alt="Balança de fundo"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 0,
          }}
          draggable={false}
        />

        {/* overlay leve */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.06)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Mensagem superior */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            textAlign: "center",
            color: "rgba(255,255,255,0.92)",
            fontSize: "2rem",
            fontFamily: '"Inter", sans-serif',
            fontWeight: 300,
            textShadow:
               "0 0 12px rgba(103,232,249,0.6), 0 0 25px rgba(103,232,249,0.3)",
            backgroundColor: "rgba(0,0,0,0.35)", // fundo escuro transparente
            padding: "6px 12px",                 // espaço em volta do texto
            borderRadius: 5,      
            pointerEvents: "none",
          }}
        >
          Me da um aumento?
        </div>

        {/* SIM (botão real por cima do texto visual) */}
        <button
          ref={simButtonRef}
          onClick={handleSimClick}
          style={{
            position: "absolute",
            left: "24.5%",
            top: "62.5%",
            transform: "translate(-50%, -50%)",
            zIndex: 6,
            fontSize: "3rem",
            fontFamily: '"Inter", sans-serif',
            fontWeight: 200,
            color: "rgba(88,216,255,0.98)",
            textShadow:
              "0 0 25px rgba(103,232,249,0.85), 0 0 50px rgba(103,232,249,0.45)",
            cursor: "pointer",
            transition: "transform 0.08s",
            background: "transparent",
            border: "none",
            padding: "6px 10px",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%) scale(0.97)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%)";
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform =
              "translate(-50%, -50%) scale(0.97)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%)";
          }}
          aria-label="Botão SIM"
        >
          {/* mantém o texto visível também dentro do botão */}
          SIM
        </button>

        {/* NÃO */}
        <button
          onClick={handleNoClick}
          style={{
            position: "absolute",
            left: `${noPosition.x}%`,
            top: `${noPosition.y}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 3,
            fontSize: "3rem",
            fontFamily: '"Inter", sans-serif',
            fontWeight: 200,
            color: "rgba(250,190,21,0.98)",
            textShadow:
              "0 0 25px rgba(251,191,36,0.85), 0 0 50px rgba(251,191,36,0.45)",
            cursor: "pointer",
            transition:
              "left 0.45s cubic-bezier(.2,.8,.2,1), top 0.45s cubic-bezier(.2,.8,.2,1), transform 0.08s",
            background: "transparent",
            border: "none",
            padding: 0,
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform =
              "translate(-50%, -50%) scale(0.95)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%)";
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform =
              "translate(-50%, -50%) scale(0.95)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%)";
          }}
          aria-label="Botão não que pula"
        >
          NÃO
        </button>

        {/* partículas do estouro */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              zIndex: 9,
              pointerEvents: "none",
              transform: `translate(-50%, -50%) translate(0px, 0px) scale(1)`,
              opacity: 1,
              transition: "transform 900ms cubic-bezier(.2,.8,.2,1), opacity 900ms",
            }}
            ref={(el) => {
              if (!el) return;
              // força reflow
              void el.offsetWidth;
              // aplica target transform
              setTimeout(() => {
                el.style.transform = `translate(-50%, -50%) translate(${p.tx}px, ${p.ty}px) scale(0.6)`;
                el.style.opacity = "0";
              }, 20);
            }}
          />
        ))}

        {/* mensagem "humilde de mais" (centralizada, aparece por alguns instantes) */}
        {showSimMessage && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              color: "#fff",
              background: "rgba(0,0,0,0.55)",
              padding: "12px 20px",
              borderRadius: 16,
              fontSize: "1.8rem",
              fontFamily: '"Inter", sans-serif',
              fontWeight: 700,
              textShadow: "0 0 8px rgba(0,0,0,0.6)",
              pointerEvents: "none",
              opacity: 0,
              animation: "fadeUp 1100ms forwards",
            }}
          >
            Humilde de mais
          </div>
        )}

        {/* controle de play/pause visível */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 7,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            onClick={togglePlayback}
            style={{
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              border: "none",
              padding: "8px 10px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {isPlaying ? "Pausar" : hasUserInteracted ? "Tocar" : "Tocar (clique em qualquer lugar primeiro)"}
          </button>
        </div>

        {/* keyframes */}
        <style>{`
          @keyframes fadeUp {
            0% { transform: translate(-50%, -50%) translateY(8px); opacity: 0; }
            20% { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
            100% { opacity: 0; transform: translate(-50%, -50%) translateY(-14px); }
          }
        `}</style>
      </div>
    </div>
  );
}
