 ⚡ Neon Lab - Three.js Lighting & PBR Test

O **Neon Lab** é um ambiente experimental de renderização 3D desenvolvido com **Three.js**. O projeto foca em técnicas avançadas de iluminação cinematográfica, materiais PBR (Physically Based Rendering) e interatividade em tempo real.

## 🚀 Tecnologias Utilizadas

- **Three.js**: Motor 3D principal.
- **Vite**: Build tool e servidor de desenvolvimento ultra-rápido.
- **lil-gui**: Interface interativa para controle de parâmetros.
- **Post-Processing**: Efeitos de Bloom (brilho) avançados.
- **PBR Materials**: Uso de `MeshPhysicalMaterial` com camadas de verniz (`clearcoat`) e refração.

## ✨ Destaques Técnicos

- **Iluminação Geométrica:** Uso de `RectAreaLights` para simular painéis de luz SFX reais.
- **IBL (Image Based Lighting):** Ambiente de estúdio via `RoomEnvironment` para reflexos realistas.
- **Grounding (Contact Shadows):** Sombras de contato dinâmicas que dão peso e realismo aos objetos.
- **Controle Total:** Painel lateral para ajustar cores, intensidades de luz e propriedades físicas dos materiais.

## 📦 Instalação e Uso

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.

### 1. Clonar e Instalar
```bash
# Instalar dependências
npm install
```

### 2. Iniciar Desenvolvimento
```bash
# Rodar servidor local
npm run dev
```
Acesse `http://localhost:5173` no seu navegador.

### 3. Build para Produção
```bash
# Gerar bundle otimizado
npm run build
```

## 🎮 Como Testar
- **Orbit Controls:** Use o mouse (Left-click) para girar a câmera e o scroll para zoom.
- **Painel de Controle:** No canto superior direito, use os sliders para mudar a intensidade do Bloom, as cores dos painéis RGB e a aparência da esfera central.

---

Desenvolvido para estudos de luz e materiais em ambientes FiveM/Cinemáticos.
