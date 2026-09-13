import React, { useState } from 'react';
import { Project, Floor } from '../types/cad';
import { 
  Sparkles, Send, Bot, User, Calculator, 
  HelpCircle, Shield, X, ArrowRight, BookOpen
} from 'lucide-react';

interface AIAssistantModalProps {
  project: Project;
  activeFloor: Floor;
  onClose: () => void;
  onAddSymbolSuggested?: (code: string) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  project,
  activeFloor,
  onClose,
  onAddSymbolSuggested
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Olá! Sou o **Signaflux AI**, seu engenheiro assistente especialista em Segurança Contra Incêndio e Pânico (ABNT NBR 13434, NBR 16820 e Instruções Técnicas dos Corpos de Bombeiros Militares).

Como posso te auxiliar no projeto **"${project.nome}"** hoje? Você pode me pedir dimensionamento de placas pela fórmula da NBR 13434, conferência de rotas de fuga ou seleção de símbolos.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sizing Calculator State
  const [calcDistance, setCalcDistance] = useState(15);
  const [calcAreaMm, setCalcAreaMm] = useState<number | null>(null);
  const [calcRecommended, setCalcRecommended] = useState<string>('');

  const handleCalculateSize = (dist: number) => {
    // ABNT NBR 13434-1 Item 5.1.2: A >= L^2 / 2000
    // A in m^2, L in meters
    const areaM2 = (dist * dist) / 2000;
    const areaCm2 = areaM2 * 10000;
    setCalcAreaMm(areaCm2);

    if (dist <= 5) {
      setCalcRecommended('150 x 100 mm ou 100 x 100 mm');
    } else if (dist <= 10) {
      setCalcRecommended('200 x 100 mm ou 200 x 200 mm');
    } else if (dist <= 15) {
      setCalcRecommended('250 x 150 mm ou 250 x 250 mm');
    } else if (dist <= 20) {
      setCalcRecommended('300 x 200 mm ou 300 x 300 mm');
    } else {
      setCalcRecommended('400 x 300 mm ou superior');
    }
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    // Smart Engineering Response Engine
    setTimeout(() => {
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('cálculo') || q.includes('formula') || q.includes('dimensão') || q.includes('distância')) {
        reply = `### Dimensionamento de Placas conforme ABNT NBR 13434-1

A área mínima da superfície da placa de sinalização é calculada pela fórmula:
$$A \\ge \\frac{L^2}{2000}$$
Onde:
- **A** = área da placa em metros quadrados ($m^2$)
- **L** = distância máxima de visualização do observador em metros ($m$)

**Tabela de Equivalências Práticas:**
- **Até 5 metros:** Área mínima $0,0125 m^2$ → Placa recomendada: **150 x 100 mm**
- **Até 10 metros:** Área mínima $0,0500 m^2$ → Placa recomendada: **250 x 200 mm**
- **Até 15 metros:** Área mínima $0,1125 m^2$ → Placa recomendada: **250 x 150 mm** ou **300 x 200 mm**
- **Até 20 metros:** Área mínima $0,2000 m^2$ → Placa recomendada: **400 x 300 mm**`;
      } else if (q.includes('escada') || q.includes('pressurizada') || q.includes('porta corta-fogo')) {
        reply = `### Exigências para Escada Enclausurada / Pressurizada

Conforme NBR 13434 e IT-20 CBMESP:
1. **Identificação dos Pavimentos (S-14/S-15):** Devem ser fixadas no interior da caixa da escada, na parede em frente ao patamar de chegada, a uma altura de **1,80m a 2,20m**, indicando o andar (ex: "TÉRREO", "1º ANDAR") e se há saída para o exterior.
2. **Porta Corta-Fogo (P-10):** Deve conter a placa "PORTA CORTA-FOGO - MANTENHA FECHADA" em ambas as faces da folha da porta, a **1,60m** de altura.
3. **Sentido de Fuga:** No interior da escada, placas indicando o sentido descendente em direção à descarga exterior.`;
      } else if (q.includes('fotoluminescência') || q.includes('nbr 16820') || q.includes('autonomia')) {
        reply = `### Critérios de Fotoluminescência (NBR 16820 / NBR 13434-3)

A sinalização de emergência deve possuir características fotoluminescentes comprovadas por laudo técnico laboratorial:
- **Luminância aos 10 minutos:** Mínimo de **140 mcd/m²** (milicandelas por metro quadrado).
- **Luminância aos 60 minutos:** Mínimo de **20 mcd/m²**.
- **Tempo de atenuação:** Mínimo de **1800 minutos (30 horas)** até atingir 0,3 mcd/m².
- **Substrato:** PVC rígido autoextinguível anti-chamas de no mínimo 2mm de espessura ou chapa de alumínio/ACM.`;
      } else if (q.includes('hidrante') || q.includes('extintor')) {
        reply = `### Sinalização de Extintores e Hidrantes (NBR 13434-2)

1. **Sinalização de Parede (E-5 / E-8):** Fixada a uma altura de **1,80 m** medida do piso acabado à base da placa, diretamente sobre o equipamento.
2. **Demarcação de Solo (Complementar C-1):** Quadrado de **1,00 m x 1,00 m** com bordas vermelhas de 15 cm e miolo amarelo ou zebrado vermelho/amarelo, proibindo o bloqueio por caixas ou móveis.
3. **Placa de Extintor (E-5):** Deve identificar claramente o agente extintor (Água Pressurizada, Pó Químico Seco ABC ou $CO_2$).`;
      } else {
        reply = `Com base nas normas técnicas brasileiras vigentes (**ABNT NBR 13434**, **NBR 16820** e **Instruções Técnicas dos Corpos de Bombeiros**):

Para o pavimento **${activeFloor.name}** do projeto **${project.nome}**, certifique-se de que:
- O caminhamento máximo desobstruído até uma saída não ultrapasse os limites da IT-11.
- Todas as placas de saída estejam desimpedidas de pilares ou divisórias corporativas.
- As placas de equipamentos possuam fotoluminescência mínima de 140 mcd/m².

Deseja que eu dimensione alguma rota específica ou calcule o quantitativo de placas para este pavimento?`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-900/40">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">Signaflux AI</h3>
                <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded font-mono">
                  NBR 13434 / NBR 16820
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Assistente de Engenharia Contra Incêndio e Pânico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sizing Calculator Ribbon */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calculator className="w-4 h-4 text-sky-400" />
            <span className="font-semibold">Calculadora Rápida NBR 13434 (A ≥ L²/2000):</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Distância:</span>
            <select
              value={calcDistance}
              onChange={(e) => {
                const d = parseInt(e.target.value);
                setCalcDistance(d);
                handleCalculateSize(d);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
            >
              <option value={5}>5 metros</option>
              <option value={10}>10 metros</option>
              <option value={15}>15 metros</option>
              <option value={20}>20 metros</option>
              <option value={25}>25 metros</option>
            </select>
            <button
              onClick={() => handleCalculateSize(calcDistance)}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium"
            >
              Calcular
            </button>
            {calcRecommended && (
              <span className="font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800">
                {calcRecommended}
              </span>
            )}
          </div>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center shrink-0 text-white shadow">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl p-4 leading-relaxed ${msg.sender === 'user' ? 'bg-sky-600 text-white' : 'bg-slate-800/90 border border-slate-700 text-slate-200'}`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 font-mono ${msg.sender === 'user' ? 'text-sky-200' : 'text-slate-400'}`}
                >
                  {msg.timestamp}
                </div>
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-slate-200">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <Bot className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>Signaflux AI analisando normas técnicas e calculando...</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0">Perguntas frequentes:</span>
          {[
            'Qual o cálculo da dimensão da placa para 15 metros?',
            'Quais são as exigências para escada enclausurada?',
            'Qual a luminância mínima pela NBR 16820?',
            'Como sinalizar extintores e hidrantes?'
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full shrink-0 border border-slate-700 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Pergunte sobre normas ABNT NBR 13434, cálculos de visibilidade ou instruções técnicas..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim()}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-lg transition flex items-center gap-2"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
