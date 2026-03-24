import { TopicTaxonomy } from '../types';

export const TOPIC_TAXONOMY: TopicTaxonomy[] = [
  { slug: 'incident-response',       name: 'Olay Müdahalesi',              icon: '🚨', color: '#E74C3C',
    keywords: ['incident', 'olay müdahale', 'olay yönetimi', 'csirt', 'isirt', 'containment', 'kontrol altına', 'siber olay', 'müdahale ekibi', 'post-incident', 'pir', 'playbook', 'runbook', 'müdahale planı'] },
  { slug: 'access-control',          name: 'Erişim Kontrolü',              icon: '🔐', color: '#8E44AD',
    keywords: ['erişim kontrolü', 'access control', 'rbac', 'least privilege', 'yetkilendirme', 'authorization', 'privilege', 'idor', 'erişim yönetimi', 'erişim kısıtlama'] },
  { slug: 'identity-authentication', name: 'Kimlik Doğrulama & IAM',       icon: '👤', color: '#2980B9',
    keywords: ['kimlik doğrulama', 'authentication', 'mfa', 'oturum', 'session', 'iam', 'sso', 'parola', 'password', 'brute force', 'bcrypt', 'argon2', 'kullanıcı kaydı', 'hesap yönetimi'] },
  { slug: 'cryptography',            name: 'Kriptografi & Şifreleme',      icon: '🔒', color: '#16A085',
    keywords: ['kriptografi', 'şifreleme', 'encryption', 'tls', 'aes', 'ssl', 'hsts', 'sertifika', 'certificate', 'kriptografik', 'https', 'transit şifreleme'] },
  { slug: 'vulnerability-management',name: 'Zafiyet & Yama Yönetimi',     icon: '🛠️', color: '#E67E22',
    keywords: ['zafiyet', 'vulnerability', 'patch', 'cve', 'sca', 'sbom', 'güncelleme', 'update', 'tarama', 'scan', 'zafiyete', 'yama', 'güvenlik açığı'] },
  { slug: 'risk-management',         name: 'Risk Yönetimi',                icon: '📊', color: '#D35400',
    keywords: ['risk yönetimi', 'risk management', 'risk değerlendirme', 'risk analizi', 'tehdit modelleme', 'stride', 'risk azaltma', 'risk fırsatlar', 'it risk'] },
  { slug: 'business-continuity',     name: 'İş Sürekliliği & DR',          icon: '♻️', color: '#27AE60',
    keywords: ['iş sürekliliği', 'business continuity', 'bcp', 'drp', 'rto', 'rpo', 'felaket kurtarma', 'disaster recovery', 'hizmet sürekliliği', 'kurtarma', 'yedekleme', 'backup'] },
  { slug: 'asset-management',        name: 'Varlık & Envanter Yönetimi',   icon: '🗃️', color: '#7F8C8D',
    keywords: ['varlık yönetimi', 'asset management', 'cmdb', 'envanter', 'inventory', 'yapılandırma yönetimi', 'configuration item', 'ci ', 'varlık envanteri'] },
  { slug: 'supply-chain',            name: 'Tedarik Zinciri & 3. Taraf',   icon: '🔗', color: '#6D4C41',
    keywords: ['tedarik zinciri', 'supply chain', 'üçüncü taraf', 'third party', 'tedarikçi', 'vendor', 'tpsp', 'ortak yönetimi', 'hizmet sağlayıcı'] },
  { slug: 'data-protection',         name: 'Veri Koruma & Gizlilik',       icon: '🔏', color: '#C0392B',
    keywords: ['veri koruma', 'data protection', 'kvkk', 'gdpr', 'kişisel veri', 'personal data', 'gizlilik', 'privacy', 'dpia', 'dpo', 'verbis', 'veri ihlali'] },
  { slug: 'network-security',        name: 'Ağ Güvenliği',                 icon: '🌐', color: '#2471A3',
    keywords: ['ağ güvenliği', 'network security', 'firewall', 'ids', 'ips', 'ndr', 'netflow', 'segmentation', 'ağ izleme', 'ağ yönetimi', 'network slicing', 'ağ altyapı'] },
  { slug: 'logging-monitoring',      name: 'Loglama, İzleme & SIEM',       icon: '📡', color: '#1ABC9C',
    keywords: ['log', 'logging', 'siem', 'izleme', 'monitoring', 'audit log', 'ueba', 'anomali', 'anomaly', 'denetim günlüğü', 'merkezi log', 'performans izleme'] },
  { slug: 'change-management',       name: 'Değişiklik & Release Yönetimi',icon: '🔄', color: '#9B59B6',
    keywords: ['değişiklik yönetimi', 'change management', 'cab', 'rfc', 'release', 'deployment', 'ci/cd', 'üretim geçişi', 'yayın yönetimi'] },
  { slug: 'security-awareness',      name: 'Güvenlik Farkındalığı & Eğitim',icon: '📚', color: '#F39C12',
    keywords: ['güvenlik farkındalığı', 'security awareness', 'eğitim', 'training', 'phishing', 'sosyal mühendislik', 'social engineering', 'farkındalık', 'phishing simülasyonu'] },
  { slug: 'application-security',    name: 'Uygulama Güvenliği',           icon: '🕷️', color: '#922B21',
    keywords: ['uygulama güvenliği', 'application security', 'owasp', 'sast', 'dast', 'sdlc', 'sql injection', 'xss', 'enjeksiyon', 'ssrf', 'input validation', 'sanitizasyon', 'girdi doğrulama'] },
  { slug: 'cloud-security',          name: 'Bulut Güvenliği',              icon: '☁️', color: '#2980B9',
    keywords: ['bulut güvenliği', 'cloud security', 'cloud', 'saas', 'paas', 'iaas', 'çoklu kiracı', 'cloud provider', 'cloud risk', 'veri konumu'] },
  { slug: 'governance-compliance',   name: 'Yönetişim & Uyum',             icon: '🏛️', color: '#566573',
    keywords: ['yönetişim', 'governance', 'uyum', 'compliance', 'politika', 'policy', 'liderlik', 'üst yönetim', 'yönetim organı', 'sorumluluk', 'denetim komitesi'] },
  { slug: 'data-classification',     name: 'Veri Sınıflandırma & DLP',     icon: '🏷️', color: '#B7950B',
    keywords: ['veri sınıflandırma', 'data classification', 'dlp', 'veri kaybı', 'hassas veri', 'sensitive data', 'veri etiketleme', 'veri envanteri', 'pseudonimizasyon'] },
  { slug: 'physical-security',       name: 'Fiziksel Güvenlik',            icon: '🏢', color: '#784212',
    keywords: ['fiziksel güvenlik', 'physical security', 'veri merkezi', 'data center', 'ortam güvenliği', 'fiziksel erişim', 'temiz masa', 'clean desk'] },
  { slug: 'security-testing',        name: 'Güvenlik Testi & Sızma Testi', icon: '🎯', color: '#7B241C',
    keywords: ['sızma testi', 'penetrasyon', 'pentest', 'kırmızı takım', 'red team', 'tlpt', 'güvenlik testi', 'security test', 'dayanıklılık testi', 'tablotop'] },
];

export function matchTopics(control: { title?: string; category?: string; keywords?: string[] }): string[] {
  const text = [
    control.title || '',
    control.category || '',
    ...(control.keywords || []),
  ].join(' ').toLowerCase();

  return TOPIC_TAXONOMY.filter(topic =>
    topic.keywords.some(kw => text.includes(kw.toLowerCase()))
  ).map(t => t.slug);
}
