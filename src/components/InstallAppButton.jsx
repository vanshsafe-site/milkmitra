import { useLanguage } from '../lib/language.jsx'

export default function InstallAppButton({ className = '' }) {
  const { t } = useLanguage()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [help, setHelp] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setInstalled(standalone)
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent) && !standalone)
    const onPrompt = (event) => { event.preventDefault(); setInstallPrompt(event) }
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); setHelp(false) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) { setHelp((current) => !current); return }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice?.outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }
  if (installed) return null
  return (
    <div className="install-app">
      <button type="button" className={className || 'btn install-btn'} onClick={install} aria-expanded={help}>{t('Download app')}</button>
      {help && <p className="install-help" role="status">{t(isIos
        ? 'To install on iPhone or iPad: tap Share in Safari, then choose “Add to Home Screen”.'
        : 'To install, use your browser’s Install app option or choose “Add to Home Screen” from its menu. Open this site in a supported browser over HTTPS.')}</p>}
    </div>
  )
}
