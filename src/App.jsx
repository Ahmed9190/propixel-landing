import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Zap, 
  Smartphone, 
  BarChart3, 
  CheckCircle2, 
  MousePointer2, 
  Menu,
  X,
  Star,
  Globe,
  ChevronDown,
  ChevronUp,
  CreditCard,
  MessageSquare,
  Sparkles,
  Loader2
} from 'lucide-react';

// --- Global API Configuration ---
// --- Global API Configuration ---
const MAX_RETRIES = 5;


// --- API Utility Function ---
const fetchGeminiResponse = async (userQuery, systemPrompt, useGrounding = false) => {
    const payload = { userQuery, systemPrompt, useGrounding };

    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch('/.netlify/functions/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Retrying...');
                }
                const errorBody = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorBody.error?.message || response.statusText}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                let sources = [];
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    sources = groundingMetadata.groundingAttributions
                        .map(attribution => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter(source => source.uri && source.title);
                }
                return { text, sources };
            }
            throw new Error("Failed to extract content from Gemini response.");

        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES - 1 && error.message.includes('Rate limit exceeded')) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw lastError; 
        }
    }
    throw lastError;
};

// --- Data & Content ---

const PORTFOLIO_ITEMS = [
  {
    id: 1,
    title: "كمبوند سكاي لاين",
    category: "realestate",
    image: "https://plus.unsplash.com/premium_photo-1671358689953-ee06a6671fce?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "صفحة هبوط لمشروع عقاري فاخر تهدف لجمع بيانات العملاء المهتمين.",
    stats: { conversion: "8.5%", leads: "1,240", time: "0.8s" },
    challenge: "كان العميل يعاني من ارتفاع تكلفة النقرة وضعف جودة المسجلين.",
    solution: "قمنا بتصميم صفحة تركز على القيمة البصرية، مع نموذج تسجيل ذكي وفلترة تلقائية للعملاء غير الجادين.",
    tags: ["Real Estate", "Lead Gen", "PPC"]
  },
  {
    id: 2,
    title: "متجر نون ستايل",
    category: "ecommerce",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    description: "إعادة تصميم صفحة المنتج لمتجر ملابس لزيادة معدل الإضافة للسلة.",
    stats: { conversion: "4.2%", leads: "350+ Sales", time: "1.1s" },
    challenge: "معدل ارتداد عالي في صفحات الجوال.",
    solution: "تحسين تجربة المستخدم على الجوال (Mobile-First)، وإضافة عناصر الثقة (Social Proof) بشكل بارز.",
    tags: ["E-commerce", "CRO", "Shopify"]
  },
  {
    id: 3,
    title: "تطبيق صحتي",
    category: "saas",
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    description: "صفحة تعريفية لتطبيق طبي لحجز المواعيد.",
    stats: { conversion: "12%", leads: "5k Downloads", time: "0.9s" },
    challenge: "شرح مميزات التطبيق المعقدة بشكل بسيط.",
    solution: "استخدام الرسوم المتحركة (Animations) لشرح آلية العمل، والتركيز على فوائد المستخدم النهائي.",
    tags: ["SaaS", "App Landing", "Tech"]
  }
];

const PRICING_PLANS = [
  {
    name: "الباقة الأساسية",
    price: "499$",
    features: ["صفحة هبوط واحدة", "تصميم متجاوب (Mobile)", "ربط نموذج الاتصال", "تحسين السرعة الأساسي", "تسليم خلال 3 أيام"],
    recommended: false
  },
  {
    name: "الباقة الاحترافية",
    price: "899$",
    features: ["تصميم مخصص (Custom UI)", "كتابة المحتوى التسويقي", "ربط Analytics & Pixel", "A/B Testing (نسختين)", "تحسين متقدم للسرعة", "دعم فني أسبوعين"],
    recommended: true
  },
  {
    name: "باقة الشركات",
    price: "تواصل معنا",
    features: ["موقع متعدد الصفحات", "نظام إدارة محتوى (CMS)", "استراتيجية تحويل متكاملة", "ربط مع CRM", "صيانة شهرية", "تصميم 3D وتفاعلي"],
    recommended: false
  }
];

const FAQS = [
  { q: "كم يستغرق تصميم الصفحة؟", a: "تستغرق المشاريع العادية من 3 إلى 5 أيام عمل، حسب تعقيد التصميم وتوفر المحتوى." },
  { q: "هل تكتبون المحتوى التسويقي؟", a: "نعم، في الباقة الاحترافية نقدم خدمة كتابة نصوص إعلانية (Copywriting) موجهة للبيع." },
  { q: "ما المنصات التي تستخدمونها؟", a: "نستخدم أحدث التقنيات: React, Next.js للكود الخاص، أو Webflow و WordPress حسب رغبة العميل." },
  { q: "هل تقدمون ضمان على النتائج؟", a: "نضمن لك تسليم صفحة خالية من الأخطاء الفنية وسريعة، ونستخدم أفضل الممارسات لرفع معدل التحويل، لكن النتائج تعتمد أيضاً على جودة الزوار (Ads)." }
];

// --- Components ---

const FadeInSection = ({ children, delay = "0ms", className = "" }) => {
  const [visible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setVisible(true);
      });
    });
    const currentElement = domRef.current;
    if (currentElement) observer.observe(currentElement);
    return () => {
      if (currentElement) observer.unobserve(currentElement);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: delay }}
      className={`transition-all duration-1000 ease-out transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const Navbar = ({ isMenuOpen, setIsMenuOpen, scrolled }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass-nav shadow-lg py-3' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link 
          to="/"
          className="flex items-center gap-2 font-bold text-2xl text-indigo-900 cursor-pointer"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Zap size={20} fill="white" />
          </div>
          <span>برو بيكسل</span>
        </Link>

        <div className="hidden md:flex gap-8 font-medium text-slate-600">
          <Link to="/" className={`${currentPath === '/' ? 'text-indigo-600' : 'hover:text-indigo-600'} transition-colors`}>الرئيسية</Link>
          <Link to="/portfolio" className={`${currentPath.startsWith('/portfolio') ? 'text-indigo-600' : 'hover:text-indigo-600'} transition-colors`}>معرض الأعمال</Link>
          <Link to="/services" className={`${currentPath === '/services' ? 'text-indigo-600' : 'hover:text-indigo-600'} transition-colors`}>الخدمات والأسعار</Link>
        </div>

        <Link to="/contact" className="hidden md:flex items-center gap-2 bg-indigo-900 text-white px-6 py-2.5 rounded-full hover:bg-indigo-800 transition-all shadow-lg hover:shadow-indigo-500/30 font-bold shimmer">
          اطلب استشارة
          <ArrowLeft size={18} />
        </Link>

        <button className="md:hidden text-slate-800" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 font-bold text-2xl text-white mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Zap size={20} fill="white" />
            </div>
            <span>برو بيكسل</span>
          </div>
          <p className="text-slate-400 leading-relaxed max-w-sm">
            نساعد الشركات ورواد الأعمال على تحويل الزوار إلى عملاء دائمين من خلال تصميم صفحات هبوط ذكية، سريعة، ومقنعة.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">روابط سريعة</h4>
          <ul className="space-y-4">
            <li><Link to="/portfolio" className="hover:text-white transition-colors">معرض الأعمال</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">الخدمات</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">اتصل بنا</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">تواصل معنا</h4>
          <ul className="space-y-4">
            <li>hello@propixel.com</li>
            <li>+966 50 000 0000</li>
            <li>الرياض، المملكة العربية السعودية</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm">© 2025 برو بيكسل. جميع الحقوق محفوظة.</p>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 flex items-center justify-center transition-colors cursor-pointer">
            <Globe size={16} />
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// --- Views ---

const HomeView = () => {
  const navigate = useNavigate();
  return (
  <>
    {/* Hero Section */}
    <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="hero-blob bg-blue-400 w-96 h-96 rounded-full top-0 left-0 mix-blend-multiply"></div>
      <div className="hero-blob bg-indigo-400 w-96 h-96 rounded-full bottom-0 right-0 mix-blend-multiply animation-delay-2000"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 text-center lg:text-right">
            <FadeInSection>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold mb-6 border border-indigo-100">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                متاح لاستلام مشاريع جديدة
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                تصميم صفحات هبوط <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 to-blue-500">تضاعف مبيعاتك</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                نجمع بين جمال التصميم، علم النفس التسويقي، والسرعة الفائقة لنحول زوار موقعك إلى عملاء فعليين. تخصص في قطاعات العقارات والتجارة الإلكترونية.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/contact" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/40 flex items-center justify-center gap-2">
                  ابدأ مشروعك الآن
                  <ArrowLeft size={20} />
                </Link>
                <Link to="/portfolio" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                    <Star size={14} fill="currentColor" />
                  </span>
                  شاهد معرض الأعمال
                </Link>
              </div>
            </FadeInSection>
          </div>

          <div className="lg:w-1/2 relative">
            <FadeInSection delay="200ms">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 transform rotate-2 hover:rotate-0 transition-all duration-500 group cursor-pointer" onClick={() => navigate('/portfolio')}>
                <div className="bg-slate-100 rounded-t-xl p-3 flex gap-2 items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="bg-white rounded px-4 py-1 text-xs text-slate-400 flex-1 text-center mx-4">skyline-compound.com</div>
                </div>
                <div className="bg-slate-50 rounded-b-xl overflow-hidden relative h-64 sm:h-80 md:h-96">
                  <img 
                    src={PORTFOLIO_ITEMS[0].image}
                    alt="Real Estate Landing Page" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex flex-col justify-end p-6 text-white">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">دراسة حالة</span>
                      <h3 className="text-2xl font-bold">كمبوند سكاي لاين</h3>
                      <div className="flex gap-4 mt-4">
                         <div className="flex flex-col">
                           <span className="text-xs text-slate-400">معدل التحويل</span>
                           <span className="font-bold text-green-400">8.5% ↗</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-xs text-slate-400">سرعة التحميل</span>
                           <span className="font-bold text-blue-400">0.8s ⚡</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -left-4 top-10 bg-white p-4 rounded-xl shadow-xl animate-bounce duration-[3000ms] z-20 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg text-green-600">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">زيادة المبيعات</p>
                    <p className="text-lg font-bold text-slate-800">+240%</p>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </div>
    </header>

    {/* Features */}
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-indigo-600 font-bold text-sm tracking-wider">لماذا نحن؟</span>
          <h2 className="text-3xl lg:text-4xl font-extrabold mt-2 text-slate-900">كل ما تحتاجه لصفحة هبوط ناجحة</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Smartphone size={32} />, title: "تصميم متجاوب 100%", desc: "تجربة مستخدم مثالية على الجوال والتابلت.", color: "bg-blue-100 text-blue-600" },
            { icon: <Zap size={32} />, title: "سرعة تحميل فائقة", desc: "تحسين الأكواد لضمان التحميل في <1 ثانية.", color: "bg-yellow-100 text-yellow-600" },
            { icon: <MousePointer2 size={32} />, title: "نصوص مقنعة", desc: "كتابة إعلانية (Copywriting) تركز على البيع.", color: "bg-purple-100 text-purple-600" }
          ].map((feature, idx) => (
            <FadeInSection key={idx} delay={`${idx * 100}ms`}>
              <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 h-full">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>

    {/* Brief Portfolio Preview */}
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">أحدث أعمالنا</h2>
            <p className="text-slate-500 mt-2">مشاريع حققت نتائج استثنائية لعملائنا.</p>
          </div>
          <Link to="/portfolio" className="text-indigo-600 font-bold hover:gap-2 flex items-center gap-1 transition-all">
            عرض الكل <ArrowLeft size={18} />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {PORTFOLIO_ITEMS.slice(0, 2).map((item) => (
            <FadeInSection key={item.id}>
              <div className="group cursor-pointer" onClick={() => navigate(`/project/${item.id}`)}>
                <div className="rounded-2xl overflow-hidden mb-4 relative">
                  <img src={item.image} alt={item.title} className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                <p className="text-slate-500 text-sm mt-1">{item.category === 'realestate' ? 'قطاع العقارات' : 'تجارة إلكترونية'}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  </>
  );
};

const PortfolioView = () => {
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  
  const filteredItems = filter === 'all' 
    ? PORTFOLIO_ITEMS 
    : PORTFOLIO_ITEMS.filter(item => item.category === filter);

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">معرض الأعمال</h1>
        <p className="text-lg text-slate-600">نحن فخورون بالنتائج التي حققناها لشركاء النجاح. تصفح المشاريع لترى الجودة بنفسك.</p>
      </div>

      <div className="flex justify-center gap-2 mb-12 flex-wrap">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'realestate', label: 'عقارات' },
          { id: 'ecommerce', label: 'متاجر' },
          { id: 'saas', label: 'تطبيقات وخدمات' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              filter === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item, idx) => (
          <FadeInSection key={item.id} delay={`${idx * 100}ms`}>
            <div 
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group cursor-pointer"
              onClick={() => navigate(`/project/${item.id}`)}
            >
              <div className="relative h-64 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
                  {item.category === 'realestate' ? 'عقارات' : item.category === 'ecommerce' ? 'متجر' : 'تطبيق'}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{item.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-2">
                    {item.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{tag}</span>
                    ))}
                  </div>
                  <ArrowLeft size={16} className="text-indigo-500 transform group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </FadeInSection>
        ))}
      </div>
    </div>
  );
};

const ProjectDetailView = () => {
  const { id } = useParams();
  const project = PORTFOLIO_ITEMS.find(p => p.id === parseInt(id));
  
  if (!project) return <div>Project not found</div>;

  return (
    <div className="pt-24 pb-20">
      <div className="bg-slate-900 text-white pb-32 pt-20">
        <div className="container mx-auto px-6">
          <Link to="/portfolio" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-bold">
            <ArrowLeft size={16} className="rotate-180" /> العودة للمعرض
          </Link>
          <div className="max-w-4xl">
            <div className="flex gap-3 mb-6">
              {project.tags.map(tag => (
                <span key={tag} className="bg-indigo-600/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30">{tag}</span>
              ))}
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">{project.title}</h1>
            <p className="text-xl text-slate-300 max-w-2xl">{project.description}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-24 relative z-10">
        <FadeInSection>
          <img src={project.image} alt={project.title} className="w-full h-[400px] md:h-[600px] object-cover rounded-2xl shadow-2xl border-4 border-white" />
        </FadeInSection>

        <div className="grid lg:grid-cols-3 gap-12 mt-16">
          <div className="lg:col-span-2 space-y-12">
            <FadeInSection>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><Zap size={18}/></div>
                التحدي
              </h3>
              <p className="text-slate-600 leading-loose text-lg">{project.challenge}</p>
            </FadeInSection>
            
            <FadeInSection delay="100ms">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 size={18}/></div>
                الحل المقدم
              </h3>
              <p className="text-slate-600 leading-loose text-lg">{project.solution}</p>
            </FadeInSection>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100 sticky top-32">
              <h4 className="font-bold text-indigo-900 mb-6 text-xl">نتائج المشروع</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-indigo-600 font-medium mb-1">معدل التحويل (Conversion Rate)</p>
                  <p className="text-4xl font-extrabold text-slate-900">{project.stats.conversion}</p>
                </div>
                <div>
                  <p className="text-sm text-indigo-600 font-medium mb-1">عدد العملاء (Leads/Sales)</p>
                  <p className="text-4xl font-extrabold text-slate-900">{project.stats.leads}</p>
                </div>
                <div>
                  <p className="text-sm text-indigo-600 font-medium mb-1">سرعة الصفحة</p>
                  <p className="text-4xl font-extrabold text-slate-900">{project.stats.time}</p>
                </div>
              </div>
              <Link to="/contact" className="w-full mt-8 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors block text-center">
                اطلب مشروع مشابه
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServicesView = () => (
  <div className="pt-32 pb-20 bg-slate-50">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6">باقات تناسب جميع الاحتياجات</h1>
        <p className="text-lg text-slate-600">سواء كنت رائد أعمال يبدأ رحلته أو شركة تبحث عن التوسع، لدينا الحل المناسب.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PRICING_PLANS.map((plan, idx) => (
          <FadeInSection key={idx} delay={`${idx * 100}ms`}>
            <div className={`relative p-8 rounded-2xl bg-white border ${plan.recommended ? 'border-indigo-500 shadow-2xl scale-105 z-10' : 'border-slate-200 shadow-sm'} flex flex-col h-full`}>
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  الأكثر مبيعاً
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <div className="text-3xl font-extrabold text-indigo-600 mb-6">{plan.price}</div>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link 
                to="/contact"
                className={`w-full py-3 rounded-xl font-bold transition-colors block text-center ${plan.recommended ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
              >
                اختر الباقة
              </Link>
            </div>
          </FadeInSection>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-24">
        <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">أسئلة شائعة</h3>
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const [isOpen, setIsOpen] = useState(false);
            return (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full flex justify-between items-center p-6 text-right hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-800">{faq.q}</span>
                  {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const ContactView = () => {
  const [llmQuery, setLlmQuery] = useState('');
  const [llmResponse, setLlmResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [llmSources, setLlmSources] = useState([]);
  const [llmError, setLlmError] = useState(null);

  const handleGenerateStrategy = async () => {
    if (llmQuery.trim().length < 20) {
      setLlmError('الرجاء إدخال وصف مفصل للمشروع لا يقل عن 20 حرفاً.');
      return;
    }

    setIsLoading(true);
    setLlmResponse(null);
    setLlmSources([]);
    setLlmError(null);

    const systemPrompt = "Act as a world-class Conversion Rate Optimization (CRO) strategist and digital marketing expert. Your task is to analyze the provided project description and generate a concise, professional, and actionable initial strategy brief for a high-conversion landing page. The output must be structured using Arabic Markdown headings and bullet points. Focus on: 1. Target Audience Hypothesis, 2. Key Value Proposition (UVP) Suggestion, 3. Recommended Design Elements (e.g., Social Proof, Urgency), 4. A single Call-to-Action (CTA) suggestion. Use Google Search to ground your suggestions with current industry best practices and data, especially if a specific industry is mentioned. Keep the response professional and highly relevant to the goal of high conversion.";
    const userQuery = `Project details for initial strategy brief: ${llmQuery}`;
    
    try {
        const { text, sources } = await fetchGeminiResponse(userQuery, systemPrompt, true);
        setLlmResponse(text.replace(/\n/g, '<br/>')); 
        setLlmSources(sources);
    } catch (error) {
        console.error("Gemini API Error:", error);
        setLlmError(`حدث خطأ أثناء الاتصال بخدمة Gemini: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="pt-32 pb-20 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16">
          
          {/* Form Column */}
          <div className="order-2 md:order-1">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-6">لنبدأ مشروعك القادم</h1>
            <p className="text-lg text-slate-600 mb-8">
              املأ النموذج وسنتواصل معك خلال 24 ساعة لمناقشة التفاصيل. الاستشارة الأولية مجانية تماماً.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">تواصل مباشر</p>
                  <p className="text-slate-500">hello@propixel.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">أسعار تنافسية</p>
                  <p className="text-slate-500">تبدأ من 499$ فقط</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-xl mt-8">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="اسمك الكريم" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                  <input type="email" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نوع المشروع</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option>تصميم صفحة هبوط</option>
                    <option>متجر إلكتروني</option>
                    <option>موقع شركة</option>
                    <option>أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">تفاصيل إضافية (للتواصل)</label>
                  <textarea rows="2" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="رسالة مختصرة..."></textarea>
                </div>
                <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 flex justify-center items-center gap-2">
                  إرسال طلب استشارة
                  <ArrowLeft size={18} />
                </button>
              </form>
            </div>
          </div>

          {/* Gemini Feature Column */}
          <div className="order-1 md:order-2">
            <div className="bg-indigo-900 p-8 rounded-3xl text-white shadow-xl h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Sparkles size={24} className="text-yellow-400" fill="yellow" />
                  تحليل المشروع المبدئي الفوري
              </h2>
              <p className="text-slate-300 mb-6 flex-shrink-0">
                  أدخل وصفاً مفصلاً لمشروعك (الصناعة، الجمهور المستهدف، الهدف الرئيسي) وسنقوم بتوليد ملخص استراتيجي مقترح ومحترف.
              </p>
              
              <textarea 
                  rows="4" 
                  value={llmQuery}
                  onChange={(e) => {
                    setLlmQuery(e.target.value);
                    setLlmError(null); // Clear error on new input
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-indigo-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-indigo-800 text-white placeholder-slate-400 mb-4 flex-shrink-0" 
                  placeholder="مثال: متجر لبيع الملابس المستدامة يستهدف الشباب في الرياض. الهدف هو زيادة معدل التحويل من 1% إلى 3% خلال 3 أشهر."
              ></textarea>

              {llmError && <p className="text-red-400 text-sm mb-4 flex-shrink-0">{llmError}</p>}

              <button 
                  onClick={handleGenerateStrategy}
                  disabled={isLoading || llmQuery.trim().length < 20}
                  className="w-full bg-yellow-500 text-indigo-900 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 flex-shrink-0"
              >
                  {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        جاري التحليل...
                      </>
                  ) : (
                      <>
                          <Sparkles size={18} fill="currentColor" />
                          توليد الملخص الاستراتيجي
                      </>
                  )}
              </button>

              {llmResponse && (
                  <div className="mt-6 bg-indigo-800 p-4 rounded-xl flex-grow overflow-auto border border-yellow-500/50">
                      <h4 className="font-bold text-yellow-400 mb-2">الملخص المقترح:</h4>
                      <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{__html: llmResponse}}></div>
                      
                      {llmSources.length > 0 && (
                          <div className="mt-4 border-t border-indigo-700 pt-3">
                              <p className="text-xs font-bold text-slate-400 mb-1">مصادر المعرفة:</p>
                              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                                  {llmSources.map((source, index) => (
                                      <li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 underline">{source.title}</a></li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

// Scroll to top on route change
const ScrollToTop = ({ setIsMenuOpen }) => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (setIsMenuOpen) setIsMenuOpen(false);
  }, [pathname, setIsMenuOpen]);
  return null;
};

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  return (
    <BrowserRouter>
      <div dir="rtl" className="font-sans text-slate-800 bg-white min-h-screen selection:bg-indigo-500 selection:text-white">
        <ScrollToTop setIsMenuOpen={setIsMenuOpen} />
        <Navbar 
          isMenuOpen={isMenuOpen} 
          setIsMenuOpen={setIsMenuOpen} 
          scrolled={scrolled} 
        />

        {isMenuOpen && (
          <div className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden">
            <div className="flex flex-col gap-6 text-xl font-bold text-center">
              <Link to="/" className="hover:text-indigo-600">الرئيسية</Link>
              <Link to="/portfolio" className="hover:text-indigo-600">معرض الأعمال</Link>
              <Link to="/services" className="hover:text-indigo-600">الخدمات</Link>
              <Link to="/contact" className="bg-indigo-600 text-white py-3 rounded-xl">اتصل بنا</Link>
            </div>
          </div>
        )}

        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/portfolio" element={<PortfolioView />} />
            <Route path="/services" element={<ServicesView />} />
            <Route path="/contact" element={<ContactView />} />
            <Route path="/project/:id" element={<ProjectDetailView />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
