import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useLanguage } from '../lib/language.jsx'
import Logo from '../components/Logo.jsx'
import InstallAppButton from '../components/InstallAppButton.jsx'
import '../home.css'

export default function Home() {
  const { session } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const go = session ? '/dashboard' : '/login'
  const features = [
    ['⚖', 'Measure', 'Record each milk collection digitally with accurate quantity tracking.'],
    ['▣', 'Identify', 'Give every farmer a unique ID and QR code for quick identification.'],
    ['⚗', 'Track quality', 'Record fat and SNF values and calculate rates consistently.'],
    ['₹', 'Manage payments', 'See pending dues and keep payment records in one place.'],
  ]
  const steps = [
    ['01', 'Register farmers', 'Create farmer profiles and assign unique IDs with QR codes.'],
    ['02', 'Record collections', 'Enter milk quantity and quality; the amount is calculated automatically.'],
    ['03', 'Track and pay', 'Review collection history, pending balances, and completed payments.'],
  ]

  return (
    <div className="home" id="home">
      <header className="topbar">
        <a className="home-brand" href="#home" aria-label={t('MilkMitra home')}><Logo size={52} /></a>
        <nav aria-label={t('Main navigation')}>
          <a href="#home">{t('Home')}</a>
          <a href="#features">{t('Features')}</a>
          <a href="#how-it-works">{t('How it works')}</a>
          <Link to={session ? '/farmers' : '/login'}>{t('Farmers')}</Link>
          <Link to={session ? '/records' : '/login'}>{t('Records')}</Link>
        </nav>
        <div className="topbar-actions">
          <button type="button" className="language-switch light" onClick={toggleLanguage} aria-label={language === 'en' ? 'Switch language to Hindi' : 'भाषा अंग्रेज़ी में बदलें'}>
            {language === 'en' ? 'हिन्दी' : 'English'}
          </button>
          <InstallAppButton />
          <Link className="btn green" to={go}>{t(session ? 'Open dashboard' : 'Get Started')}</Link>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            <span className="hero-eyebrow">{t('A simpler way to manage your dairy centre')}</span>
            <h1 id="hero-title">{t('Smart milk collection,')}<br /><em>{t('fair payment')}</em><br />{t('for every farmer')}</h1>
            <p>{t('MilkMitra helps you identify farmers, record milk quality, calculate payments, and keep your collection centre organized.')}</p>
            <ul className="ticks">
              <li>{t('Digital milk weighing')}</li><li>{t('QR farmer ID')}</li>
              <li>{t('Quality recording')}</li><li>{t('Automatic payment')}</li>
            </ul>
            <div className="hero-btns">
              <Link className="btn black" to={go}>{t('Open dashboard')}</Link>
              <a className="btn outline" href="#how-it-works">{t('How it works')}</a>
            </div>
          </div>
        </section>

        <section id="features" className="home-section features-section" aria-labelledby="features-title">
          <div className="section-heading">
            <span className="section-kicker">{t('Everything in one place')}</span>
            <h2 id="features-title">{t('Made for your collection centre')}</h2>
            <p>{t('Spend less time on paperwork and keep every collection and payment easy to find.')}</p>
          </div>
          <div className="feature-grid">
            {features.map(([icon, title, description]) => (
              <article key={title} className="feature-card">
                <span className="circle" aria-hidden="true">{icon}</span>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="home-section steps-section" aria-labelledby="steps-title">
          <div className="section-heading">
            <span className="section-kicker">{t('A straightforward workflow')}</span>
            <h2 id="steps-title">{t('From collection to payment')}</h2>
            <p>{t('Three simple steps keep your daily dairy operations organized.')}</p>
          </div>
          <div className="steps-grid">
            {steps.map(([number, title, description]) => (
              <article key={number} className="step-card">
                <span className="step-number">{number}</span>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-cta" aria-labelledby="cta-title">
          <div>
            <span className="section-kicker">{t('Get started with MilkMitra')}</span>
            <h2 id="cta-title">{t('Bring your collection records together.')}</h2>
            <p>{t('Manage farmers, daily collections, and payments from one dashboard.')}</p>
          </div>
          <div className="home-cta-actions">
            <InstallAppButton />
            <Link className="btn green" to={go}>{t(session ? 'Go to dashboard' : 'Get started')}</Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <a href="#home" aria-label={t('Back to top')}><Logo size={42} /></a>
        <span>{t('MilkMitra · Smart milk collection, fair payment.')}</span>
        <a href="#home">{t('Back to top ↑')}</a>
      </footer>
    </div>
  )
}
