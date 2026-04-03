import { useNavigate } from "react-router-dom";
import {
  Zap, ShieldCheck, TrendingUp, Store, Paintbrush, Eye, BarChart3,
  Globe, CreditCard, Smartphone, Package, Infinity, Settings2,
  ArrowRight, CheckCircle2, Layers, Link2, Bell, ShoppingCart
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(240,10%,4%)] text-[hsl(0,0%,95%)] overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[hsl(230,15%,12%)] bg-[hsl(240,10%,4%)/0.85] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-[hsl(263,70%,58%)]">Void</span>Tok
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-[hsl(220,10%,60%)]">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
          </div>
          <button
            onClick={() => navigate("/register")}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-[hsl(263,70%,58%)] text-white hover:bg-[hsl(263,70%,52%)] transition-colors"
          >
            Começar Agora
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32 text-center overflow-hidden">
        {/* Glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,hsl(263,70%,58%,0.12),transparent_70%)]" />
          <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-[radial-gradient(ellipse,hsl(199,89%,48%,0.06),transparent_70%)]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(230,15%,16%)] bg-[hsl(240,6%,9%)] text-xs text-[hsl(220,10%,60%)] mb-8">
            <span className="w-2 h-2 rounded-full bg-[hsl(263,70%,58%)]" />
            PLATAFORMA DE ALTA CONVERSÃO
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            VENDA QUE{" "}
            <span className="text-[hsl(263,70%,58%)]">CONECTA, PERSONALIZA</span>
            <br />
            E CONVERTE
          </h1>

          <p className="mt-6 text-lg text-[hsl(220,10%,55%)] max-w-2xl mx-auto leading-relaxed">
            Crie lojas e checkouts personalizados com alta conversão.
            Gerencie produtos, pedidos, upsells e integrações em um único painel.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3 rounded-full font-semibold bg-[hsl(263,70%,58%)] text-white hover:bg-[hsl(263,70%,52%)] transition-colors text-sm"
            >
              Começar Agora
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 rounded-full font-semibold border border-[hsl(230,15%,20%)] text-white hover:bg-[hsl(230,15%,12%)] transition-colors text-sm"
            >
              Acessar Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(263,70%,58%,0.06),transparent)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(230,15%,16%)] bg-[hsl(240,6%,9%)] text-xs text-[hsl(220,10%,60%)] mb-6">
                <span className="w-2 h-2 rounded-full bg-[hsl(152,60%,48%)]" />
                PLATAFORMA COMPLETA
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                A Plataforma que{" "}
                <span className="void-text-gradient">Vende Mais</span>
                <br />com Sua Identidade
              </h2>
              <p className="mt-6 text-[hsl(220,10%,55%)] max-w-2xl mx-auto leading-relaxed">
                Checkout personalizável, lojas ilimitadas, integrações com gateways e pixels.
                Tudo em um painel intuitivo feito para alta conversão.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm">
                {[
                  { icon: Store, label: "Lojas Ilimitadas" },
                  { icon: CreditCard, label: "Multi-Gateway" },
                  { icon: Zap, label: "Checkout Rápido" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-[hsl(220,10%,60%)]">
                    <Icon className="w-4 h-4 text-[hsl(263,70%,58%)]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="recursos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Paintbrush,
              title: "Personalização Total",
              desc: "Checkout builder drag-and-drop. Customize cores, textos, layout e componentes sem código.",
              color: "hsl(263,70%,58%)",
            },
            {
              icon: CreditCard,
              title: "Multi-Gateway",
              desc: "Conecte múltiplos gateways de pagamento PIX. BlackCatPay, GhostsPay, Duck, Hiso e Paradise.",
              color: "hsl(199,89%,48%)",
            },
            {
              icon: ShieldCheck,
              title: "Transparência Total",
              desc: "Checkout transparente sem redirecionamentos. Seus clientes permanecem no seu ambiente durante toda a jornada.",
              color: "hsl(152,60%,48%)",
            },
            {
              icon: Zap,
              title: "Alta Conversão",
              desc: "Order bumps, upsells e checkout otimizado para maximizar cada venda. Aumento real no ticket médio.",
              color: "hsl(38,92%,50%)",
            },
            {
              icon: BarChart3,
              title: "Analytics Avançado",
              desc: "Funil de conversão, live view com globo 3D, métricas em tempo real e relatórios completos.",
              color: "hsl(263,70%,58%)",
            },
            {
              icon: Globe,
              title: "Rastreamento Completo",
              desc: "Integração com TikTok Pixel, Meta Pixel, UTMify e webhooks para rastrear cada conversão.",
              color: "hsl(199,89%,48%)",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] p-6 hover:border-[hsl(230,15%,20%)] transition-colors group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-[hsl(220,10%,50%)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upsell Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(230,15%,16%)] bg-[hsl(240,6%,9%)] text-xs text-[hsl(220,10%,60%)] mb-6">
              <span className="w-2 h-2 rounded-full bg-[hsl(263,70%,58%)]" />
              ORDER BUMPS & UPSELLS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Venda mais com{" "}
              <span className="text-[hsl(263,70%,58%)]">Order Bumps</span>
            </h2>
            <p className="text-[hsl(220,10%,50%)] leading-relaxed mb-6">
              Adicione ofertas complementares no checkout que aumentam o ticket médio.
              Configure produtos extras com preços especiais, imagens e posições personalizadas.
            </p>
            <div className="space-y-3 text-sm">
              {["Aumente seu ticket médio", "Ofertas automáticas no checkout", "Posicionamento e ordem personalizáveis"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[hsl(220,10%,60%)]">
                  <ArrowRight className="w-4 h-4 text-[hsl(263,70%,58%)]" />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] p-8">
            <div className="rounded-lg bg-[hsl(240,6%,12%)] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(263,70%,58%)] to-[hsl(199,89%,48%)]" />
                <div>
                  <p className="font-semibold text-white text-sm">Oferta Especial</p>
                  <p className="text-xs text-[hsl(220,10%,50%)]">Adicione ao pedido com 1 clique</p>
                </div>
              </div>
              <button className="w-full py-2.5 rounded-lg bg-[hsl(263,70%,58%)] text-white font-semibold text-sm hover:bg-[hsl(263,70%,52%)] transition-colors">
                Adicionar ao Pedido
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Stores */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(230,15%,16%)] bg-[hsl(240,6%,9%)] text-xs text-[hsl(220,10%,60%)] mb-6">
            <Infinity className="w-3 h-3" />
            LOJAS ILIMITADAS
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="text-[hsl(263,70%,58%)]">Liberdade</span> para Crescer Sem Limites
          </h2>
          <p className="text-[hsl(220,10%,50%)] max-w-2xl mx-auto leading-relaxed mb-12">
            Crie quantas lojas precisar, todas gerenciadas em um único painel.
            Vitrines independentes com identidade visual própria, produtos e slugs únicos.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Store, title: "Lojas Ilimitadas", desc: "Crie quantas lojas precisar, todas gerenciadas em um único painel." },
              { icon: Settings2, title: "Gestão Centralizada", desc: "Controle todas as suas lojas através de uma única interface intuitiva." },
              { icon: Infinity, title: "Possibilidades Infinitas", desc: "Expanda seus negócios sem restrições, com total liberdade para crescer." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] p-6 text-left hover:border-[hsl(230,15%,20%)] transition-colors"
              >
                <Icon className="w-6 h-6 text-[hsl(263,70%,58%)] mb-4" />
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-[hsl(220,10%,50%)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades Grid */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(230,15%,16%)] bg-[hsl(240,6%,9%)] text-xs text-[hsl(220,10%,60%)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[hsl(199,89%,48%)]" />
            FUNCIONALIDADES
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Algumas Funcionalidades <span className="text-[hsl(263,70%,58%)]">VoidTok</span>
          </h2>
          <p className="text-[hsl(220,10%,50%)] max-w-2xl mx-auto mb-12">
            Descubra as ferramentas que tornam o VoidTok a escolha ideal para seu negócio
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShoppingCart, label: "Order Bumps" },
              { icon: Package, label: "Checkout Builder" },
              { icon: Eye, label: "Live View" },
              { icon: TrendingUp, label: "Analytics" },
              { icon: Layers, label: "Product Builder" },
              { icon: Bell, label: "Notificações" },
              { icon: Link2, label: "Webhooks" },
              { icon: Smartphone, label: "PWA Mobile" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] p-5 text-left hover:border-[hsl(230,15%,20%)] transition-colors"
              >
                <Icon className="w-5 h-5 text-[hsl(263,70%,58%)] mb-3" />
                <p className="text-sm font-medium text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrações */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(230,15%,16%)] bg-[hsl(240,6%,9%)] text-xs text-[hsl(220,10%,60%)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[hsl(152,60%,48%)]" />
            INTEGRAÇÕES
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Rastreamento e <span className="void-text-gradient">Análise Completa</span>
          </h2>
          <p className="text-[hsl(220,10%,50%)] max-w-2xl mx-auto mb-12">
            Conecte suas ferramentas favoritas e otimize suas campanhas
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "TikTok Pixel", "Meta Pixel", "UTMify", "Webhooks", "TikTok Ads",
            ].map((name) => (
              <div
                key={name}
                className="rounded-xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] px-8 py-6 hover:border-[hsl(230,15%,20%)] transition-colors"
              >
                <p className="text-sm font-medium text-white">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(230,15%,16%)] bg-[hsl(240,6%,9%)] text-xs text-[hsl(220,10%,60%)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[hsl(263,70%,58%)]" />
            PREÇOS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            <span className="text-[hsl(263,70%,58%)]">Escolha o plano</span> ideal para seu negócio
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="rounded-xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] p-8 text-left">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[hsl(220,10%,15%)] text-[hsl(220,10%,60%)] mb-4">
                Gratuito
              </span>
              <h3 className="text-xl font-bold text-white">Start</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xs text-[hsl(220,10%,50%)]">R$</span>
                <span className="text-4xl font-bold text-white">0</span>
                <span className="text-sm text-[hsl(220,10%,50%)]">/mês</span>
              </div>
              <p className="text-sm text-[hsl(263,70%,58%)] mt-2">• 2,5% por transação</p>
              <p className="text-sm text-[hsl(220,10%,50%)] mt-3">Comece a vender online agora mesmo</p>
              <ul className="mt-6 space-y-3">
                {["Checkout completo", "Personalização de temas", "Integrações com gateways", "Live View com globo 3D", "Suporte via chat"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[hsl(220,10%,60%)]">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(152,60%,48%)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="w-full mt-8 py-3 rounded-lg bg-[hsl(263,70%,58%)] text-white font-semibold text-sm hover:bg-[hsl(263,70%,52%)] transition-colors"
              >
                Começar Agora
              </button>
            </div>

            {/* Pro */}
            <div className="rounded-xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] p-8 text-left">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[hsl(199,89%,48%,0.15)] text-[hsl(199,89%,48%)] mb-4">
                Intermediário
              </span>
              <h3 className="text-xl font-bold text-white">Pro</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xs text-[hsl(220,10%,50%)]">R$</span>
                <span className="text-4xl font-bold text-white">147</span>
                <span className="text-sm text-[hsl(220,10%,50%)]">/mês</span>
              </div>
              <p className="text-sm text-[hsl(199,89%,48%)] mt-2">• 2,0% por transação</p>
              <p className="text-sm text-[hsl(220,10%,50%)] mt-3">Ideal para quem já fatura e quer crescer</p>
              <ul className="mt-6 space-y-3">
                {["Tudo do plano Start", "Analytics avançados", "Mais integrações", "Suporte prioritário", "Relatórios completos", "Checkout personalizado"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[hsl(220,10%,60%)]">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(152,60%,48%)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="w-full mt-8 py-3 rounded-lg bg-[hsl(263,70%,58%)] text-white font-semibold text-sm hover:bg-[hsl(263,70%,52%)] transition-colors"
              >
                Começar Agora
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-xl border border-[hsl(230,15%,12%)] bg-[hsl(240,6%,7%)] p-8 text-left">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[hsl(263,70%,58%,0.15)] text-[hsl(263,70%,58%)] mb-4">
                Avançado
              </span>
              <h3 className="text-xl font-bold text-white">Enterprise</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xs text-[hsl(220,10%,50%)]">R$</span>
                <span className="text-4xl font-bold text-white">497</span>
                <span className="text-sm text-[hsl(220,10%,50%)]">/mês</span>
              </div>
              <p className="text-sm text-[hsl(263,70%,58%)] mt-2">• 1,5% por transação</p>
              <p className="text-sm text-[hsl(220,10%,50%)] mt-3">Recursos premium para maximizar suas vendas</p>
              <ul className="mt-6 space-y-3">
                {["Tudo do plano Pro", "Menor taxa de transação", "Integrações ilimitadas", "Suporte premium", "Atualizações em primeira mão", "Implementação assistida"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[hsl(220,10%,60%)]">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(152,60%,48%)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="w-full mt-8 py-3 rounded-lg bg-[hsl(263,70%,58%)] text-white font-semibold text-sm hover:bg-[hsl(263,70%,52%)] transition-colors"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(230,15%,12%)] py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <span className="text-lg font-bold">
              <span className="text-[hsl(263,70%,58%)]">Void</span>Tok
            </span>
            <p className="mt-3 text-sm text-[hsl(220,10%,50%)] leading-relaxed">
              Plataforma completa para criar lojas e checkouts de alta conversão.
              Personalizável e sem burocracia.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-[hsl(220,10%,50%)]">
              <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
              <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Políticas</h4>
            <ul className="space-y-2 text-sm text-[hsl(220,10%,50%)]">
              <li><a href="#" className="hover:text-white transition-colors">Políticas de Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Suporte</h4>
            <ul className="space-y-2 text-sm text-[hsl(220,10%,50%)]">
              <li>Atendimento via chat</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[hsl(230,15%,12%)] text-center text-xs text-[hsl(220,10%,40%)]">
          © {new Date().getFullYear()} VoidTok. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
